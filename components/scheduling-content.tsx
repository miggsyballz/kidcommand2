"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { List, Trash2, Save, Send, Bot, Music, Calendar, X, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SortableSpreadsheet } from "./sortable-spreadsheet"
import { getCellDisplayValue } from "@/lib/duration-utils"

interface Playlist {
  id: string
  name: string
  description?: string
  song_count: number
  total_duration: string
  created_at: string
  column_structure?: string
}

interface PlaylistEntry {
  id: number
  data: Record<string, any>
  playlist_id?: number
  source_file?: string
  position: number
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
  const [viewMode, setViewMode] = useState<"cards" | "list">("list")
  const [loading, setLoading] = useState(true)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistEntries, setPlaylistEntries] = useState<PlaylistEntry[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
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

  const fetchPlaylistEntries = async (playlistId: string) => {
    try {
      setEntriesLoading(true)

      const { data: entriesData, error: entriesError } = await supabase
        .from("playlist_entries")
        .select("id, data, playlist_id, source_file, position, created_at")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true })

      if (entriesError) throw entriesError

      // Process entries
      const processedEntries = (entriesData || [])
        .filter((entry) => {
          if (!entry.data || typeof entry.data !== "object") {
            console.warn("Filtering out entry with invalid data:", entry)
            return false
          }
          return true
        })
        .map((entry) => {
          let data = entry.data
          if (typeof data === "string") {
            try {
              data = JSON.parse(data)
            } catch (e) {
              console.warn("Failed to parse entry data:", entry.id, e)
              return null
            }
          }
          return { ...entry, data, position: entry.position || 0 }
        })
        .filter(Boolean) as PlaylistEntry[]

      setPlaylistEntries(processedEntries)

      // Extract columns
      const allColumns = new Set<string>()
      processedEntries.forEach((entry) => {
        if (entry.data && typeof entry.data === "object") {
          Object.keys(entry.data).forEach((key) => {
            if (key && key.trim()) {
              allColumns.add(key)
            }
          })
        }
      })

      // Try to get column structure from playlist
      const playlist = playlists.find((p) => p.id === playlistId)
      let columnsToUse: string[] = []

      if (playlist?.column_structure) {
        try {
          const parsedStructure = JSON.parse(playlist.column_structure)
          if (Array.isArray(parsedStructure)) {
            columnsToUse = parsedStructure
          }
        } catch (e) {
          console.warn("Failed to parse column_structure:", e)
        }
      }

      if (columnsToUse.length === 0) {
        columnsToUse = Array.from(allColumns).sort()
      }

      setColumns(columnsToUse)
    } catch (error) {
      console.error("Error fetching playlist entries:", error)
      toast.error("Failed to load playlist entries")
    } finally {
      setEntriesLoading(false)
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
      // Create playlist
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .insert({
          name: schedule.title,
          description: `AI-generated ${schedule.duration} schedule`,
          song_count: schedule.songs.length,
          total_duration: schedule.duration,
          column_structure: JSON.stringify(["Title", "Artist", "Runs", "Start Time", "End Time"]),
        })
        .select()
        .single()

      if (playlistError) throw playlistError

      // Create playlist entries
      const entries = schedule.songs.map((song: any, index: number) => ({
        playlist_id: playlist.id,
        position: index + 1,
        data: {
          Title: song.title,
          Artist: song.artist,
          Runs: song.duration,
          "Start Time": song.start_time,
          "End Time": song.end_time,
        },
      }))

      const { error: entriesError } = await supabase.from("playlist_entries").insert(entries)

      if (entriesError) throw entriesError

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

      // Close view if the deleted playlist was selected
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null)
      }
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
    }
  }

  const handleViewPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    await fetchPlaylistEntries(playlist.id)
  }

  const handleClosePlaylistView = () => {
    setSelectedPlaylist(null)
    setPlaylistEntries([])
    setColumns([])
  }

  // Spreadsheet handlers
  const getEntryValue = (entry: PlaylistEntry, column: string): string => {
    if (!entry.data || typeof entry.data !== "object") {
      return "-"
    }
    const value = entry.data[column]
    return getCellDisplayValue(value, column)
  }

  const handleEntriesReorder = async (newEntries: PlaylistEntry[]) => {
    setPlaylistEntries(newEntries)

    try {
      const updates = newEntries.map((entry) => ({
        id: entry.id,
        position: entry.position,
        playlist_id: entry.playlist_id,
      }))

      const { error } = await supabase.from("playlist_entries").upsert(updates, { onConflict: "id" })

      if (error) throw error
    } catch (err) {
      console.error("Error updating entry positions:", err)
      toast.error("Failed to update entry order")
    }
  }

  const handleColumnsReorder = async (newColumns: string[]) => {
    setColumns(newColumns)

    try {
      if (selectedPlaylist) {
        await supabase
          .from("playlists")
          .update({ column_structure: JSON.stringify(newColumns) })
          .eq("id", selectedPlaylist.id)
      }
    } catch (err) {
      console.error("Error updating column order:", err)
      toast.error("Failed to update column order")
    }
  }

  const handleCellEdit = async (entryId: string, column: string, value: any) => {
    try {
      const entry = playlistEntries.find((e) => e.id === Number(entryId))
      if (!entry) return

      const updatedData = {
        ...entry.data,
        [column]: value,
      }

      const { error } = await supabase.from("playlist_entries").update({ data: updatedData }).eq("id", entryId)

      if (error) throw error

      // Update local state
      setPlaylistEntries((prev) => prev.map((e) => (e.id === Number(entryId) ? { ...e, data: updatedData } : e)))
    } catch (err) {
      console.error("Error updating cell:", err)
      throw err
    }
  }

  const handleHeaderEdit = async (oldColumn: string, newColumn: string) => {
    try {
      // Update all entries to rename the column
      const updates = playlistEntries.map(async (entry) => {
        if (!entry.data || typeof entry.data !== "object") return

        const newData = { ...entry.data }
        if (oldColumn in newData) {
          newData[newColumn] = newData[oldColumn]
          delete newData[oldColumn]

          const { error } = await supabase.from("playlist_entries").update({ data: newData }).eq("id", entry.id)

          if (error) throw error
        }
      })

      await Promise.all(updates)

      // Update local state
      setColumns((prev) => prev.map((col) => (col === oldColumn ? newColumn : col)))

      setPlaylistEntries((prev) =>
        prev.map((entry) => {
          if (!entry.data || typeof entry.data !== "object") return entry
          const newData = { ...entry.data }
          if (oldColumn in newData) {
            newData[newColumn] = newData[oldColumn]
            delete newData[oldColumn]
          }
          return { ...entry, data: newData }
        }),
      )

      // Update column structure
      if (selectedPlaylist) {
        const newColumns = columns.map((col) => (col === oldColumn ? newColumn : col))
        await supabase
          .from("playlists")
          .update({ column_structure: JSON.stringify(newColumns) })
          .eq("id", selectedPlaylist.id)
      }
    } catch (err) {
      console.error("Error updating header:", err)
      throw err
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", entryId)

      if (error) throw error

      setPlaylistEntries((prev) => prev.filter((e) => e.id !== Number(entryId)))
      toast.success("Entry deleted successfully")
    } catch (err) {
      console.error("Error deleting entry:", err)
      toast.error("Failed to delete entry")
    }
  }

  const handleAddColumn = async () => {
    const columnName = prompt("Enter new column name:")
    if (!columnName || !columnName.trim()) return

    const trimmedName = columnName.trim()
    if (columns.includes(trimmedName)) {
      alert("Column already exists!")
      return
    }

    const newColumns = [...columns, trimmedName].sort()
    setColumns(newColumns)

    // Update column structure
    if (selectedPlaylist) {
      await supabase
        .from("playlists")
        .update({ column_structure: JSON.stringify(newColumns) })
        .eq("id", selectedPlaylist.id)
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Panel - AI Schedule Generator */}
      <div className="flex-shrink-0 border-b bg-background">
        <Card className="border-0 rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              AI Schedule Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chat Messages */}
              <div className="lg:col-span-2">
                <ScrollArea className="h-40 w-full border rounded-md p-3">
                  <div className="space-y-3">
                    {aiMessages.slice(-3).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
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
                                {message.schedule.songs.slice(0, 4).map((song, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="truncate">
                                      {song.title} - {song.artist}
                                    </span>
                                    <span className="text-muted-foreground">{song.duration}</span>
                                  </div>
                                ))}
                                {message.schedule.songs.length > 4 && (
                                  <p className="text-muted-foreground">
                                    +{message.schedule.songs.length - 4} more songs
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
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
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <Input
                  placeholder="e.g., Create a 3-hour morning show with upbeat pop music..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isGenerating}
                  className="h-10"
                />
                <Button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Generate Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Navigation and Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Schedule Header */}
        <div className="flex-shrink-0 border-b p-4">
          {selectedPlaylist ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleClosePlaylistView}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{selectedPlaylist.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlaylist.description} • {playlistEntries.length} entries
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClosePlaylistView}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Your Schedules</h1>
                <p className="text-sm text-muted-foreground">Manage your saved playlists and schedules</p>
              </div>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedPlaylist ? (
            <div className="h-full p-4">
              {entriesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading schedule entries...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  {playlistEntries.length > 0 ? (
                    <div className="h-full">
                      <SortableSpreadsheet
                        entries={playlistEntries.map((entry) => ({
                          id: entry.id.toString(),
                          data: entry.data,
                          position: entry.position,
                          created_at: entry.created_at,
                          playlist_id: entry.playlist_id,
                        }))}
                        columns={columns}
                        onEntriesReorder={handleEntriesReorder}
                        onColumnsReorder={handleColumnsReorder}
                        onCellEdit={handleCellEdit}
                        onHeaderEdit={handleHeaderEdit}
                        onDeleteEntry={handleDeleteEntry}
                        onAddColumn={handleAddColumn}
                        getEntryValue={(entry, column) => getEntryValue(entry as any, column)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No entries in this schedule</h3>
                      <p className="text-muted-foreground">This schedule doesn't have any songs yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              {playlists.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No schedules yet</h3>
                    <p className="text-muted-foreground">
                      Use the AI Schedule Generator above to create your first radio show schedule
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {playlists.map((playlist) => (
                      <Card
                        key={playlist.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleViewPlaylist(playlist)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{playlist.name}</CardTitle>
                              {playlist.description && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">{playlist.description}</p>
                              )}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{playlist.name}"? This action cannot be undone and
                                    will also delete all songs in this playlist.
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
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(playlist.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{playlist.total_duration}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}
