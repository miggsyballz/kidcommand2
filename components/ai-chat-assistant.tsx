"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  Bot,
  User,
  Download,
  Trash2,
  Music,
  Search,
  BarChart3,
  Plus,
  Loader2,
  MessageSquare,
  Brain,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

// Function to search THE BRAIN knowledge base
const searchBrainKnowledge = (query: string): KnowledgeEntry[] => {
  const savedEntries = localStorage.getItem("musicmaster-brain-entries")
  if (!savedEntries) return []

  try {
    const entries: KnowledgeEntry[] = JSON.parse(savedEntries)
    const searchLower = query.toLowerCase()

    return entries
      .filter(
        (entry) =>
          entry.command.toLowerCase().includes(searchLower) ||
          entry.instructions.toLowerCase().includes(searchLower) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          entry.category.toLowerCase().includes(searchLower),
      )
      .slice(0, 3) // Limit to top 3 matches
  } catch (error) {
    console.error("Error searching brain knowledge:", error)
    return []
  }
}

// Add interface for KnowledgeEntry
interface KnowledgeEntry {
  id: string
  command: string
  category: string
  instructions: string
  example?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  action?: string
  data?: any
}

interface AIChatAssistantProps {
  onActionExecuted?: (action: string, data: any) => void
}

export function AIChatAssistant({ onActionExecuted }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi! I'm your AI music assistant. I can help you manage playlists, search your music library, analyze your collection, and more. What would you like to do?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [chatStats, setChatStats] = useState({ messages: 0, commands: 0 })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Update chat stats
    const userMessages = messages.filter((m) => m.type === "user").length
    const commandMessages = messages.filter((m) => m.action).length
    setChatStats({ messages: userMessages, commands: commandMessages })
  }, [messages])

  const processAIRequest = async (userInput: string): Promise<{ content: string; action?: string; data?: any }> => {
    const input = userInput.toLowerCase().trim()

    // First, search THE BRAIN knowledge base
    const brainMatches = searchBrainKnowledge(userInput)
    if (brainMatches.length > 0) {
      const bestMatch = brainMatches[0]
      let response = `🧠 **From THE BRAIN:** ${bestMatch.instructions}`

      if (bestMatch.example) {
        response += `\n\n**Example:** ${bestMatch.example}`
      }

      if (brainMatches.length > 1) {
        response += `\n\n**Related entries:**`
        brainMatches.slice(1).forEach((match, index) => {
          response += `\n• ${match.command}`
        })
      }

      return {
        content: response,
        action: "brain_knowledge",
        data: { matches: brainMatches, category: bestMatch.category },
      }
    }

    try {
      // Create playlist
      if (input.includes("create") && input.includes("playlist")) {
        const playlistName = userInput.replace(/create|playlist|called|named|make/gi, "").trim()
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

          if (error) throw error

          return {
            content: `✅ Created playlist "${playlistName}" successfully! You can now add songs to it or upload data.`,
            action: "create_playlist",
            data: { playlist: data },
          }
        }
        return { content: "Please specify a playlist name. For example: 'Create playlist called Workout Music'" }
      }

      // List playlists
      if ((input.includes("show") || input.includes("list") || input.includes("what")) && input.includes("playlist")) {
        const { data, error } = await supabase
          .from("playlists")
          .select("id, name, song_count, created_at")
          .order("created_at", { ascending: false })

        if (error) throw error

        if (!data || data.length === 0) {
          return {
            content: "🎵 You don't have any playlists yet. Would you like me to create one for you?",
            action: "list_playlists",
            data: { playlists: [] },
          }
        }

        const playlistInfo = data
          .map(
            (p) => `• **${p.name}** - ${p.song_count} songs (created ${new Date(p.created_at).toLocaleDateString()})`,
          )
          .join("\n")

        return {
          content: `🎵 **Your Playlists (${data.length} total):**\n\n${playlistInfo}`,
          action: "list_playlists",
          data: { playlists: data },
        }
      }

      // Search songs
      if (input.includes("search") || input.includes("find") || input.includes("look for")) {
        let searchTerm = ""

        // Extract search term
        if (input.includes("for ")) {
          searchTerm = input.split("for ")[1]
        } else if (input.includes("by ")) {
          searchTerm = input.split("by ")[1]
        } else {
          // Try to extract after common words
          const words = input.split(" ")
          const startIndex = Math.max(words.indexOf("search") + 1, words.indexOf("find") + 1, words.indexOf("look") + 2)
          searchTerm = words.slice(startIndex).join(" ")
        }

        if (searchTerm) {
          const { data, error } = await supabase
            .from("playlist_entries")
            .select("Title, Artist, Catergory, playlists(name)")
            .or(`Title.ilike.%${searchTerm}%,Artist.ilike.%${searchTerm}%,Catergory.ilike.%${searchTerm}%`)
            .limit(10)

          if (error) throw error

          if (!data || data.length === 0) {
            return {
              content: `🔍 No songs found matching "${searchTerm}". Try searching for a different artist, title, or genre.`,
              action: "search_songs",
              data: { searchTerm, results: [] },
            }
          }

          const songList = data
            .map((s) => `• **${s.Title}** by ${s.Artist} ${s.Catergory ? `(${s.Catergory})` : ""}`)
            .join("\n")

          return {
            content: `🔍 **Found ${data.length} songs matching "${searchTerm}":**\n\n${songList}`,
            action: "search_songs",
            data: { searchTerm, results: data },
          }
        }
        return {
          content:
            "Please specify what to search for. For example: 'Search for songs by Drake' or 'Find hip hop music'",
        }
      }

      // Library statistics
      if (
        input.includes("stats") ||
        input.includes("statistics") ||
        input.includes("how many") ||
        input.includes("library info")
      ) {
        const [songsResult, playlistsResult, genresResult] = await Promise.all([
          supabase.from("playlist_entries").select("id, Title, Artist").not("Title", "is", null),
          supabase.from("playlists").select("id, name, song_count"),
          supabase.from("playlist_entries").select("Catergory").not("Catergory", "is", null),
        ])

        if (songsResult.error || playlistsResult.error) {
          throw songsResult.error || playlistsResult.error
        }

        // Count unique songs (by Title + Artist)
        const uniqueSongs = new Set()
        songsResult.data?.forEach((song) => {
          uniqueSongs.add(`${song.Title}-${song.Artist}`)
        })

        // Count genres
        const genres = new Set()
        genresResult.data?.forEach((entry) => {
          if (entry.Catergory) genres.add(entry.Catergory)
        })

        const totalSongs = uniqueSongs.size
        const totalPlaylists = playlistsResult.data?.length || 0
        const totalGenres = genres.size
        const avgSongsPerPlaylist = totalPlaylists > 0 ? Math.round(totalSongs / totalPlaylists) : 0

        return {
          content: `📊 **Your Music Library Stats:**\n\n• **${totalSongs}** unique songs\n• **${totalPlaylists}** playlists\n• **${totalGenres}** different genres\n• **${avgSongsPerPlaylist}** average songs per playlist\n\nYour collection is looking great! 🎵`,
          action: "library_stats",
          data: { totalSongs, totalPlaylists, totalGenres, avgSongsPerPlaylist },
        }
      }

      // AI analysis
      if (input.includes("analy") || input.includes("ai") || input.includes("smart") || input.includes("insights")) {
        const { data, error } = await supabase
          .from("playlist_entries")
          .select("Energy, Mood, Tempo, Catergory")
          .not("Energy", "is", null)
          .not("Mood", "is", null)

        if (error) throw error

        if (!data || data.length === 0) {
          return {
            content:
              "🤖 I need more data to provide AI insights. Try uploading music with energy, mood, and tempo information.",
            action: "ai_analysis",
            data: { hasData: false },
          }
        }

        // Calculate averages
        const avgEnergy = data.reduce((sum, song) => sum + (song.Energy || 0), 0) / data.length
        const avgMood = data.reduce((sum, song) => sum + (song.Mood || 0), 0) / data.length
        const avgTempo = data.reduce((sum, song) => sum + (song.Tempo || 0), 0) / data.length

        // Find most common genre
        const genreCounts: { [key: string]: number } = {}
        data.forEach((song) => {
          if (song.Catergory) {
            genreCounts[song.Catergory] = (genreCounts[song.Catergory] || 0) + 1
          }
        })
        const topGenre = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]

        return {
          content: `🤖 **AI Analysis of Your Music:**\n\n• **Average Energy:** ${avgEnergy.toFixed(1)}/10 ${avgEnergy > 7 ? "(High energy! 🔥)" : avgEnergy > 4 ? "(Moderate energy)" : "(Chill vibes 😌)"}\n• **Average Mood:** ${avgMood.toFixed(1)}/10 ${avgMood > 7 ? "(Very positive! 😊)" : avgMood > 4 ? "(Balanced mood)" : "(Mellow mood)"}\n• **Average Tempo:** ${avgTempo.toFixed(0)} BPM\n• **Top Genre:** ${topGenre ? topGenre[0] : "Various"}\n\nYour music taste shows ${avgEnergy > 6 ? "high energy" : "relaxed"} preferences with ${avgMood > 6 ? "positive" : "balanced"} vibes! 🎵`,
          action: "ai_analysis",
          data: { avgEnergy, avgMood, avgTempo, topGenre: topGenre?.[0] },
        }
      }

      // Generate smart playlist
      if (input.includes("generate") || input.includes("smart playlist") || input.includes("recommend")) {
        let criteria = "balanced"
        if (input.includes("workout") || input.includes("gym") || input.includes("energy")) criteria = "high-energy"
        if (input.includes("chill") || input.includes("relax") || input.includes("calm")) criteria = "chill"
        if (input.includes("party") || input.includes("dance") || input.includes("upbeat")) criteria = "party"

        let query = supabase.from("playlist_entries").select("Title, Artist, Energy, Mood")

        if (criteria === "high-energy") {
          query = query.gte("Energy", 7)
        } else if (criteria === "chill") {
          query = query.lte("Energy", 5)
        } else if (criteria === "party") {
          query = query.gte("Energy", 8).gte("Mood", 7)
        }

        const { data, error } = await query.limit(10)
        if (error) throw error

        if (!data || data.length === 0) {
          return {
            content: `🎵 I couldn't find enough songs matching "${criteria}" criteria. Try uploading more music with energy and mood data.`,
            action: "generate_playlist",
            data: { criteria, songs: [] },
          }
        }

        const songList = data.map((s) => `• **${s.Title}** by ${s.Artist}`).join("\n")

        return {
          content: `🎵 **Smart Playlist Suggestion (${criteria}):**\n\n${songList}\n\nWould you like me to create a playlist with these songs?`,
          action: "generate_playlist",
          data: { criteria, songs: data },
        }
      }

      // Help
      if (input.includes("help") || input.includes("what can you do") || input.includes("commands")) {
        return {
          content: `🤖 **I can help you with:**\n\n• **Playlist Management:** "Create playlist called Workout Music"\n• **Search Music:** "Find songs by Drake" or "Search for hip hop"\n• **Library Stats:** "Show my library statistics"\n• **AI Analysis:** "Analyze my music collection"\n• **Smart Playlists:** "Generate a workout playlist"\n• **General Questions:** Just ask naturally!\n\nTry any of these or ask me anything about your music! 🎵`,
          action: "help",
        }
      }

      // Default response
      return {
        content: `🤔 I'm not sure how to help with that. I can help you manage playlists, search music, analyze your library, and more. Type "help" to see what I can do!`,
      }
    } catch (error) {
      console.error("Error processing AI request:", error)
      return {
        content:
          "❌ Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
      }
    }
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

    try {
      const response = await processAIRequest(userMessage.content)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        action: response.action,
        data: response.data,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (response.action && onActionExecuted) {
        onActionExecuted(response.action, response.data)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "❌ Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
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

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content: "Chat cleared! How can I help you with your music today?",
        timestamp: new Date(),
      },
    ])
  }

  const exportChat = () => {
    const chatData = {
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map((m) => ({
        type: m.type,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        action: m.action,
      })),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `music-ai-chat-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const quickActions = [
    { label: "Search Brain", action: "How do I", icon: Brain },
    { label: "Show Playlists", action: "Show my playlists", icon: Music },
    { label: "Library Stats", action: "Show library statistics", icon: BarChart3 },
    { label: "Search Music", action: "Search for songs", icon: Search },
    { label: "Create Playlist", action: "Create playlist called", icon: Plus },
  ]

  return (
    <div className="space-y-6">
      {/* Chat Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{chatStats.messages}</p>
                <p className="text-xs text-muted-foreground">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{chatStats.commands}</p>
                <p className="text-xs text-muted-foreground">Commands Executed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>Chat naturally about your music collection</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportChat} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={clearChat} variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(action.action)}
                className="text-xs"
              >
                <action.icon className="mr-1 h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "assistant" && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        {message.type === "user" && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                            {message.action && (
                              <Badge variant="secondary" className="text-xs">
                                {message.action}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your music, playlists, or anything else..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isProcessing} size="icon">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* Tips */}
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>💡 Tips:</strong> Try "Create playlist called Workout Music", "Search for hip hop songs", "Show my
              library stats", or just chat naturally about your music!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
