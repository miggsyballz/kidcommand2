"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Music,
  Upload,
  Settings,
  Menu,
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

interface DashboardShellProps {
  children: React.ReactNode
}

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

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
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

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Music className="h-6 w-6" />
          <span>Kid Command</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          <p>Kid Command</p>
          <p>by MaxxBeats.com</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold">Kid Command</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
      </div>

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
    </div>
  )
}
