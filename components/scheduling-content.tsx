"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Send, Bot, User, Loader2, Plus, Calendar, Music, Trash2, Eye, List, Grid3X3 } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  schedule?: GeneratedSchedule
}

interface GeneratedSchedule {
  title: string
  totalDuration: string
  totalDurationSeconds: number
  items: ScheduleItem[]
  breaks: Array<{
    afterTrack: number
    duration: string
    type: string
    notes: string
  }>
}

interface ScheduleItem {
  id: string
  title: string
  artist: string
  duration: string
  durationSeconds: number
  startTime: string
  endTime: string
  type: "song" | "interstitial" | "break"
  notes?: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  entry_count: number
}

export function SchedulingContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your Music Matrix AI assistant. I can help you create structured radio show schedules. Tell me what kind of show you want to create - specify duration, genre, energy level, or any special requirements!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards")
  const [selectedSchedule, setSelectedSchedule] = useState<GeneratedSchedule | null>(null)

  // Load playlists
  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          playlist_entries(count)
        `)
        .order("updated_at", { ascending: false })

      if (error) throw error

      const playlistsWithCounts =
        data?.map((playlist) => ({
          ...playlist,
          entry_count: playlist.playlist_entries?.[0]?.count || 0,
        })) || []

      setPlaylists(playlistsWithCounts)
    } catch (error) {
      console.error("Error loading playlists:", error)
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            type: "scheduling",
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I'm sorry, I couldn't process your request right now.",
        timestamp: new Date(),
        schedule: data.schedule || null,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
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

  const saveScheduleAsPlaylist = async (schedule: GeneratedSchedule) => {
    try {
      // Create new playlist
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .insert({
          name: schedule.title,
          description: `AI Generated Schedule - ${schedule.totalDuration} total duration`,
        })
        .select()
        .single()

      if (playlistError) throw playlistError

      // Add schedule items as playlist entries
      const entries = schedule.items.map((item, index) => ({
        playlist_id: playlist.id,
        title: item.title,
        artist: item.artist,
        runs: item.duration,
        position: index + 1,
        category: item.type === "break" ? "Break" : "Music",
        notes: item.notes || "",
      }))

      const { error: entriesError } = await supabase.from("playlist_entries").insert(entries)

      if (entriesError) throw entriesError

      toast({
        title: "Success",
        description: `Schedule saved as playlist: ${schedule.title}`,
      })

      loadPlaylists()
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        title: "Error",
        description: "Failed to save schedule as playlist",
        variant: "destructive",
      })
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    try {
      // Delete playlist entries first
      await supabase.from("playlist_entries").delete().eq("playlist_id", playlistId)

      // Delete playlist
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      })

      loadPlaylists()
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* AI Assistant Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Schedule Generator
          </CardTitle>
          <CardDescription>Create structured radio show schedules with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-64 w-full border rounded-md p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`max-w-[80%] space-y-2`}>
                      <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Schedule Preview */}
                      {message.schedule && (
                        <Card className="border-2 border-green-200">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{message.schedule.title}</CardTitle>
                              <Badge variant="secondary">{message.schedule.totalDuration}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {message.schedule.items.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <span className="truncate">
                                    {item.title} - {item.artist}
                                  </span>
                                  <span className="text-muted-foreground">{item.duration}</span>
                                </div>
                              ))}
                              {message.schedule.items.length > 5 && (
                                <p className="text-xs text-muted-foreground">
                                  +{message.schedule.items.length - 5} more items...
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => setSelectedSchedule(message.schedule!)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View Full
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveScheduleAsPlaylist(message.schedule!)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Save as Playlist
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p className="text-sm">Creating your schedule...</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your show schedule (e.g., '3-hour morning show with high energy pop hits and 2 commercial breaks')"
                disabled={isLoading}
                className="min-h-[60px]"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Playlists/Schedules Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Saved Schedules</h2>
            <p className="text-muted-foreground">Manage your playlists and AI-generated schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg truncate">{playlist.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/playlists/${playlist.id}/edit`}>
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePlaylist(playlist.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {playlist.description && (
                    <CardDescription className="line-clamp-2">{playlist.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4" />
                      {playlist.entry_count} songs
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(playlist.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="p-0 h-auto font-semibold text-base hover:bg-transparent hover:underline"
                        >
                          <a href={`/playlists/${playlist.id}/edit`}>{playlist.name}</a>
                        </Button>
                        <Badge variant="secondary">{playlist.entry_count} songs</Badge>
                      </div>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{playlist.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(playlist.updated_at).toLocaleDateString()}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePlaylist(playlist.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {playlists.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
              <p className="text-muted-foreground mb-4">
                Use the AI assistant above to create your first schedule, or create a playlist manually.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Schedule Detail Dialog */}
      {selectedSchedule && (
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedSchedule.title}</DialogTitle>
              <DialogDescription>
                Total Duration: {selectedSchedule.totalDuration} • {selectedSchedule.items.length} items
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {selectedSchedule.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === "break" ? "secondary" : "default"}>{item.type}</Badge>
                        <span className="font-medium">{item.title}</span>
                        {item.artist && <span className="text-muted-foreground">- {item.artist}</span>}
                      </div>
                      {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-mono">
                        {item.startTime} - {item.endTime}
                      </div>
                      <div className="text-muted-foreground">{item.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  saveScheduleAsPlaylist(selectedSchedule)
                  setSelectedSchedule(null)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Save as Playlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
