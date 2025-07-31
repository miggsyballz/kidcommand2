"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Home,
  Music,
  Upload,
  Settings,
  LogOut,
  Library,
  MessageCircle,
  X,
  Mic,
  Volume2,
  Send,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Playlists", href: "/playlists", icon: Music },
  { name: "Library", href: "/library", icon: Library },
  { name: "Upload Data", href: "/upload-data", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = React.useState(false)
  const [chatMinimized, setChatMinimized] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputMessage, setInputMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    router.push("/login")
  }

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert("Speech recognition is not supported in your browser.")
    }
  }

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Music className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Kid Command</span>
                    <span className="truncate text-xs">by MaxxBeats.com</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between p-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Kid Command</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>

      {/* AI Assistant Chat */}
      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {chatOpen && (
        <Card
          className={cn(
            "fixed bottom-4 right-4 w-80 shadow-xl z-50 transition-all duration-200",
            chatMinimized ? "h-12" : "h-96",
          )}
        >
          <div className="flex items-center justify-between p-3 border-b bg-purple-600 text-white rounded-t-lg">
            <h3 className="font-semibold">AI Assistant</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-purple-700"
                onClick={() => setChatMinimized(!chatMinimized)}
              >
                {chatMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-purple-700"
                onClick={() => setChatOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!chatMinimized && (
            <CardContent className="p-0 flex flex-col h-80">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm">
                      Hi! I'm your AI assistant for music production and radio programming. How can I help you today?
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.role === "user" ? "bg-purple-600 text-white" : "bg-muted",
                        )}
                      >
                        {message.content}
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-2 hover:bg-muted-foreground/20"
                            onClick={() => speakMessage(message.content)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me about music production..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage(inputMessage)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVoiceInput}
                    disabled={isListening}
                    className={cn(isListening && "bg-red-100 border-red-300")}
                  >
                    <Mic className={cn("h-4 w-4", isListening && "text-red-600")} />
                  </Button>
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </SidebarProvider>
  )
}
