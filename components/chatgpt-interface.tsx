"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Bot, User, Minimize2, Sparkles, Loader2, AlertCircle, Settings, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  isGenerating?: boolean
}

export function ChatGPTInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi Mig! I'm your AI music assistant powered by GPT-4. I can help you create playlists, analyze your beats, generate music ideas, and manage your MaxxBeats.com business. What would you like to work on today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [connectionDetails, setConnectionDetails] = useState<string>("")

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Check API connection on mount
    checkAPIConnection()
  }, [])

  const checkAPIConnection = async () => {
    try {
      setConnectionDetails("Testing connection...")

      const response = await fetch("/api/test-connection", {
        method: "GET",
      })

      const data = await response.json()

      if (data.connected) {
        setIsConnected(true)
        setApiError(null)
        setConnectionDetails("Connected to OpenAI GPT-4")
      } else {
        setIsConnected(false)
        setApiError(data.error || "Connection failed")
        setConnectionDetails(`Connection failed: ${data.error}`)
      }
    } catch (error: any) {
      setIsConnected(false)
      setApiError("Unable to connect to AI service")
      setConnectionDetails(`Network error: ${error.message}`)
    }
  }

  const processAIRequest = async (userInput: string): Promise<string> => {
    try {
      // Check for specific database operations first
      const lowerInput = userInput.toLowerCase()

      // Handle playlist creation directly
      if (lowerInput.includes("create playlist") || lowerInput.includes("make playlist")) {
        const playlistName = extractPlaylistName(userInput)
        if (playlistName) {
          const { data, error } = await supabase
            .from("playlists")
            .insert({
              name: playlistName,
              status: "active",
              song_count: 0,
              source_file: "AI Chat",
            })
            .select()
            .single()

          if (!error && data) {
            // Still call OpenAI for a personalized response
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: `I just created a playlist called "${playlistName}" for the user. Give a brief confirmation and suggest what they could do next with it.`,
                context: { action: "playlist_created", playlistName },
              }),
            })

            if (response.ok) {
              const { response: aiResponse } = await response.json()
              return aiResponse
            } else {
              const errorData = await response.json()
              throw new Error(errorData.error || "API request failed")
            }
          } else {
            return `❌ Couldn't create "${playlistName}" - it might already exist. Try a different name or check your existing playlists.`
          }
        }
      }

      // For all other requests, use OpenAI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          context: {
            userType: "music_producer",
            website: "MaxxBeats.com",
            timestamp: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const { response: aiResponse } = await response.json()
      return aiResponse
    } catch (error: any) {
      console.error("Error processing AI request:", error)
      setApiError(error.message)

      // Fallback to basic responses if API fails
      return getFallbackResponse(userInput, error.message)
    }
  }

  const getFallbackResponse = (input: string, errorMessage?: string): string => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("help")) {
      return `🤖 **AI Service Issue**

${errorMessage ? `Error: ${errorMessage}` : "I'm having trouble connecting to the AI service right now."}

I can still help with basic tasks:
• Create playlists by saying "Create playlist called [name]"
• View your library in the Library tab
• Manage playlists in the Playlists tab
• Upload music data in the Upload Data tab

**Troubleshooting:**
1. Check that OPENAI_API_KEY is set in your environment variables
2. Verify your OpenAI API key is valid and has credits
3. Try refreshing the connection using the settings button

Please fix the API configuration for full AI assistance.`
    }

    return `🤖 **Connection Issue**

${errorMessage ? `Error: ${errorMessage}` : "I'm currently unable to provide AI-powered responses due to a connection issue."}

**Quick fixes:**
1. Check your OPENAI_API_KEY environment variable
2. Verify your API key has sufficient credits
3. Click the refresh button to test connection again

In the meantime, you can still use the app's core features like playlist management and music library organization.`
  }

  const extractPlaylistName = (input: string): string | null => {
    const patterns = [
      /create playlist (?:called |named )?["']?([^"']+)["']?/i,
      /make (?:a )?playlist (?:called |named )?["']?([^"']+)["']?/i,
      /new playlist (?:called |named )?["']?([^"']+)["']?/i,
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    return null
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)
    setApiError(null)

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isGenerating: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const response = await processAIRequest(userMessage.content)

      // Remove loading message and add real response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isGenerating)
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            type: "assistant",
            content: response,
            timestamp: new Date(),
          },
        ]
      })
    } catch (error: any) {
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isGenerating)
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            type: "assistant",
            content: `❌ Sorry, I encountered an error: ${error.message}. Please check your API configuration or try again.`,
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsProcessing(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickPrompts = [
    "Create a trap beats playlist",
    "Analyze my music library",
    "Help me price my beats",
    "Show my playlists",
    "Music production workflow tips",
    "Plugin recommendations",
  ]

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Assistant
          {isConnected === false && <AlertCircle className="ml-2 h-3 w-3 text-yellow-300" />}
        </Button>
      </div>
    )
  }

  return (
    <Card className="border-b-0 rounded-b-none bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                AI Music Assistant
                {isConnected === true && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    GPT-4 Connected
                  </Badge>
                )}
                {isConnected === false && (
                  <Badge variant="destructive" className="text-xs">
                    API Disconnected
                  </Badge>
                )}
                {isConnected === null && (
                  <Badge variant="outline" className="text-xs">
                    Testing...
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{connectionDetails || "Checking connection status..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {messages.filter((m) => m.type === "user").length} messages
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkAPIConnection}
              disabled={isProcessing}
              title="Test API Connection"
            >
              <RefreshCw className={`h-4 w-4 ${isConnected === null ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Error:</strong> {apiError}
              <br />
              <span className="text-xs mt-1 block">
                Check your OPENAI_API_KEY environment variable and ensure your API key has sufficient credits.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Help */}
        {isConnected === false && (
          <Alert className="mb-4">
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> Add your OpenAI API key to environment variables:
              <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                OPENAI_API_KEY=sk-your-key-here
              </code>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInputValue(prompt)}
              className="text-xs h-7"
              disabled={isProcessing}
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="h-[300px] border rounded-lg bg-background/50 p-3 mb-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.type === "user" ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : "bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === "assistant" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === "user" && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      {message.isGenerating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">{isConnected ? "GPT-4 is thinking..." : "Processing..."}</span>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      )}
                      <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isConnected
                ? "Ask about beats, playlists, production tips, or MaxxBeats.com..."
                : "API disconnected - check your OpenAI key..."
            }
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Connection Status */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            {isConnected === true && "🟢 Connected to OpenAI GPT-4"}
            {isConnected === false && "🔴 API connection failed - check your OPENAI_API_KEY"}
            {isConnected === null && "🟡 Testing connection..."}
          </p>
        </div>
      </div>
    </Card>
  )
}
