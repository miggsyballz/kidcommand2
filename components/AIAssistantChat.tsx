"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Mic, MicOff, Volume2, VolumeX, Send, Minimize2, Maximize2 } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize speech recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          setIsListening(false)
        }

        recognitionInstance.onerror = () => {
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }

      // Initialize speech synthesis
      if ("speechSynthesis" in window) {
        setSynthesis(window.speechSynthesis)
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || data.message || "I'm sorry, I couldn't process that request.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
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
      handleSendMessage()
    }
  }

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true)
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const speakMessage = (text: string) => {
    if (synthesis && !isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      synthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesis && isSpeaking) {
      synthesis.cancel()
      setIsSpeaking(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 w-96 shadow-xl transition-all duration-300 ${
        isMinimized ? "h-14" : "h-96"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
        <CardTitle className="text-sm font-medium">🎵 AI Assistant</CardTitle>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-80">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Hey Mig! I'm your AI assistant for music production and radio programming. Ask me anything!</p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-xs opacity-70 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-50 hover:opacity-100"
                          onClick={() => (isSpeaking ? stopSpeaking() : speakMessage(message.content))}
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about music production, playlists, or radio programming..."
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-3 w-3 text-red-500 animate-pulse" /> : <Mic className="h-3 w-3" />}
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>

          {isListening && (
            <div className="text-center text-xs text-muted-foreground mt-2">🎤 Listening... Speak now!</div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
