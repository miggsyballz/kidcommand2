"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  Bot,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  schedule?: any
}

interface GeneratedSchedule {
  title: string
  totalDuration: string
  totalDurationSeconds: number
  items: Array<{
    id: string
    title: string
    artist: string
    duration: string
    startTime: string
    endTime: string
    type: "song" | "interstitial" | "break"
    notes?: string
  }>
}

const QUICK_PROMPTS = [
  "How do I import a CSV file into MusicMaster?",
  "What's the best way to set up daypart rotations?",
  "Build a 3-hour morning show with rock music",
  "How do I create a balanced playlist rotation?",
  "Generate a 2-hour jazz evening show",
  "What are the key MusicMaster scheduling rules?",
  "Create a workout playlist with high-energy songs",
  "How do I handle music library maintenance?",
]

export function ChatGPTInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        schedule: data.schedule,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Auto-speak response if enabled
      if (isSpeaking && data.message) {
        speak(data.message)
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking)
    if (isSpeaking) {
      speechSynthesis.cancel()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Header */}
      <Card className="rounded-b-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Kid Command AI Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSpeaking}
                className={isSpeaking ? "bg-green-50 border-green-200" : ""}
              >
                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat}>
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 rounded-none border-t-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Kid Command AI</h3>
                  <p className="text-muted-foreground mb-4">
                    I'm here to help with radio programming, MusicMaster software, and show scheduling.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                    {QUICK_PROMPTS.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3 bg-transparent"
                        onClick={() => sendMessage(prompt)}
                      >
                        <span className="text-xs">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                      }`}
                    >
                      {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-muted"}`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                      {/* Schedule Display */}
                      {message.schedule && (
                        <div className="mt-3 p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">{message.schedule.title}</span>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {message.schedule.totalDuration}
                            </Badge>
                          </div>

                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {message.schedule.items?.slice(0, 5).map((item: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-muted-foreground">{item.startTime}</span>
                                <Badge variant={item.type === "song" ? "default" : "outline"} className="text-xs">
                                  {item.type}
                                </Badge>
                                <span className="truncate">
                                  {item.title} {item.artist && `- ${item.artist}`}
                                </span>
                              </div>
                            ))}
                            {message.schedule.items?.length > 5 && (
                              <div className="text-xs text-muted-foreground">
                                +{message.schedule.items.length - 5} more items...
                              </div>
                            )}
                          </div>

                          <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent">
                            <Sparkles className="h-3 w-3 mr-1" />
                            View Full Schedule
                          </Button>
                        </div>
                      )}

                      <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about radio programming, MusicMaster, or request a show schedule..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                  isListening ? "bg-red-100 text-red-600" : ""
                }`}
                onClick={startListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
