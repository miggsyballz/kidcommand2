"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Grid, List, Trash2, Eye, Save, Send, Bot, Clock, Music, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Playlist {
  id: string
  name: string
  description?: string
  song_count: number
  total_duration: string
  created_at: string
}

interface AIMessage {
  id: string
  role: "user" | "assistant"
  content: string
  schedule?: {
    title: string
    duration: string
    songs: Array<{
      title: string
      artist: string
      duration: string
      start_time: string
      end_time: string
    }>
  }
}

export function SchedulingContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [loading, setLoading] = useState(true)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI Schedule Assistant. I can help you create structured radio show schedules. Just tell me what kind of show you want - the duration, genre, energy level, or theme - and I'll generate a complete schedule with songs, timing, and flow!",
    },
  ])
  const [userInput, setUserInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase.from("playlists").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
      toast.error("Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
    }

    setAiMessages((prev) => [...prev, userMessage])
    setUserInput("")
    setIsGenerating(true)

    // Simulate AI response with schedule generation
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've created a ${userInput.includes("hour") ? userInput.match(/\d+/)?.[0] || "2" : "2"}-hour schedule based on your request. Here's what I've generated:`,
        schedule: {
          title: `${userInput.includes("morning") ? "Morning" : userInput.includes("evening") ? "Evening" : "Radio"} Show Schedule`,
          duration: `${userInput.includes("hour") ? userInput.match(/\d+/)?.[0] || "2" : "2"} hours`,
          songs: [
            {
              title: "Good Morning Sunshine",
              artist: "The Beatles",
              duration: "3:24",
              start_time: "06:00:00",
              end_time: "06:03:24",
            },
            {
              title: "Here Comes The Sun",
              artist: "The Beatles",
              duration: "3:05",
              start_time: "06:03:24",
              end_time: "06:06:29",
            },
            {
              title: "Walking on Sunshine",
              artist: "Katrina & The Waves",
              duration: "3:58",
              start_time: "06:06:29",
              end_time: "06:10:27",
            },
            {
              title: "Happy",
              artist: "Pharrell Williams",
              duration: "3:53",
              start_time: "06:10:27",
              end_time: "06:14:20",
            },
            {
              title: "Can't Stop the Feeling",
              artist: "Justin Timberlake",
              duration: "3:56",
              start_time: "06:14:20",
              end_time: "06:18:16",
            },
          ],
        },
      }
      setAiMessages((prev) => [...prev, aiResponse])
      setIsGenerating(false)
    }, 2000)
  }

  const handleSaveSchedule = async (schedule: any) => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          name: schedule.title,
          description: `AI-generated ${schedule.duration} schedule`,
          song_count: schedule.songs.length,
          total_duration: schedule.duration,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Schedule saved as playlist!")
      fetchPlaylists()
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast.error("Failed to save schedule")
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    try {
      // First delete all playlist entries to avoid foreign key constraint violation
      const { error: entriesError } = await supabase.from("playlist_entries").delete().eq("playlist_id", id)

      if (entriesError) {
        console.error("Error deleting playlist entries:", entriesError)
        throw new Error("Failed to delete playlist entries")
      }

      // Then delete the playlist
      const { error: playlistError } = await supabase.from("playlists").delete().eq("id", id)

      if (playlistError) {
        console.error("Error deleting playlist:", playlistError)
        throw new Error("Failed to delete playlist")
      }

      toast.success("Playlist deleted successfully")
      fetchPlaylists()
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Schedule Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Schedule Generator
          </CardTitle>
          <CardDescription>Create structured radio show schedules with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-64 w-full border rounded-md p-4">
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>

                      {/* Schedule Preview */}
                      {message.schedule && (
                        <div className="mt-3 p-3 bg-background rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">{message.schedule.title}</h4>
                            <Badge variant="secondary">{message.schedule.duration}</Badge>
                          </div>
                          <div className="space-y-1 text-xs">
                            {message.schedule.songs.slice(0, 5).map((song, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate">
                                  {song.title} - {song.artist}
                                </span>
                                <span className="text-muted-foreground">{song.duration}</span>
                              </div>
                            ))}
                            {message.schedule.songs.length > 5 && (
                              <p className="text-muted-foreground">
                                ...and {message.schedule.songs.length - 5} more songs
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Full Schedule
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{message.schedule.title}</DialogTitle>
                                  <DialogDescription>Complete schedule timeline</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-96">
                                  <div className="space-y-2">
                                    {message.schedule.songs.map((song, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                        <div>
                                          <p className="font-medium">{song.title}</p>
                                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                          <p>
                                            {song.start_time} - {song.end_time}
                                          </p>
                                          <p className="text-muted-foreground">{song.duration}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" onClick={() => handleSaveSchedule(message.schedule)}>
                              <Save className="h-3 w-3 mr-1" />
                              Save as Playlist
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Generating schedule...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Create a 3-hour morning show with upbeat pop music..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isGenerating}
              />
              <Button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Schedules/Playlists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Schedules</h2>
            <p className="text-muted-foreground">Manage your saved playlists and schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Use the AI Schedule Generator above to create your first radio show schedule
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{playlist.name}</CardTitle>
                          {playlist.description && <CardDescription>{playlist.description}</CardDescription>}
                        </div>
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
                                Are you sure you want to delete "{playlist.name}"? This action cannot be undone and will
                                also delete all songs in this playlist.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlaylist(playlist.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Music className="h-4 w-4" />
                          <span>{playlist.song_count} songs</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{playlist.total_duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(playlist.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 bg-transparent"
                        variant="outline"
                        onClick={() => (window.location.href = `/playlists/${playlist.id}/edit`)}
                      >
                        Edit Schedule
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="space-y-1">
                          <button
                            className="text-left hover:underline font-medium"
                            onClick={() => (window.location.href = `/playlists/${playlist.id}/edit`)}
                          >
                            {playlist.name}
                          </button>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{playlist.song_count} songs</span>
                            <span>{playlist.total_duration}</span>
                            <span>{formatDate(playlist.created_at)}</span>
                          </div>
                        </div>
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
                                Are you sure you want to delete "{playlist.name}"? This action cannot be undone and will
                                also delete all songs in this playlist.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlaylist(playlist.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
