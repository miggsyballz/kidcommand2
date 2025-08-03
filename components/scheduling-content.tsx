"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Music, Search, LayoutGrid, List, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { SortableSpreadsheet } from "./sortable-spreadsheet"
import { ScheduleGenerator } from "./schedule-generator"

interface Playlist {
  id: string
  name: string
  description?: string
  song_count: number
  total_duration: number
  created_at: string
  updated_at: string
}

interface PlaylistEntry {
  id: string
  playlist_id: string
  song_id: string
  position: number
  data: Record<string, any>
  songs?: {
    title: string
    artist: string
    duration: number
    genre?: string
    year?: number
    bpm?: number
    energy?: number
    mood?: string
    intro_time?: number
    outro_time?: number
  }
}

interface Column {
  id: string
  title: string
  width: number
}

export function SchedulingContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())

  // Default columns for playlist entries
  const defaultColumns: Column[] = [
    { id: "position", title: "Position", width: 100 },
    { id: "title", title: "Title", width: 200 },
    { id: "artist", title: "Artist", width: 150 },
    { id: "duration", title: "Duration", width: 100 },
    { id: "genre", title: "Genre", width: 120 },
    { id: "year", title: "Year", width: 80 },
    { id: "bpm", title: "BPM", width: 80 },
    { id: "energy", title: "Energy", width: 100 },
    { id: "mood", title: "Mood", width: 120 },
    { id: "intro_time", title: "Intro Time", width: 100 },
    { id: "outro_time", title: "Outro Time", width: 100 },
  ]

  useEffect(() => {
    fetchPlaylists()
    setColumns(defaultColumns)
  }, [])

  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistEntries(selectedPlaylist.id)
    } else {
      setEntries([])
      setSelectedEntries(new Set())
    }
  }, [selectedPlaylist])

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase.from("playlists").select("*").order("updated_at", { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
      toast({
        title: "Error",
        description: "Failed to fetch playlists",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistEntries = async (playlistId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("playlist_entries")
        .select(`
          *,
          songs (
            title,
            artist,
            duration,
            genre,
            year,
            bpm,
            energy,
            mood,
            intro_time,
            outro_time
          )
        `)
        .eq("playlist_id", playlistId)
        .order("position")

      if (error) throw error
      setEntries(data || [])
      setSelectedEntries(new Set())
    } catch (error) {
      console.error("Error fetching playlist entries:", error)
      toast({
        title: "Error",
        description: "Failed to fetch playlist entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
  }

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null)
    setSelectedEntries(new Set())
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      // First delete all entries
      await supabase.from("playlist_entries").delete().eq("playlist_id", playlistId)

      // Then delete the playlist
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      })

      fetchPlaylists()
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null)
      }
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      })
    }
  }

  const handleSelectEntry = (entryId: string, selected: boolean) => {
    const newSelected = new Set(selectedEntries)
    if (selected) {
      newSelected.add(entryId)
    } else {
      newSelected.delete(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEntries(new Set(entries.map((entry) => entry.id)))
    } else {
      setSelectedEntries(new Set())
    }
  }

  const handleBulkDelete = async (entryIds: string[]) => {
    if (!selectedPlaylist) return

    try {
      // Delete the entries
      const { error } = await supabase.from("playlist_entries").delete().in("id", entryIds)

      if (error) throw error

      // Update playlist song count
      const remainingCount = entries.length - entryIds.length
      await supabase.from("playlists").update({ song_count: remainingCount }).eq("id", selectedPlaylist.id)

      toast({
        title: "Success",
        description: `Deleted ${entryIds.length} ${entryIds.length === 1 ? "entry" : "entries"}`,
      })

      // Refresh the entries
      fetchPlaylistEntries(selectedPlaylist.id)
      fetchPlaylists() // Refresh playlist counts
    } catch (error) {
      console.error("Error deleting entries:", error)
      toast({
        title: "Error",
        description: "Failed to delete entries",
        variant: "destructive",
      })
    }
  }

  const convertEntriesToRows = (entries: PlaylistEntry[]) => {
    return entries.map((entry) => ({
      id: entry.id,
      data: {
        position: entry.position,
        title: entry.songs?.title || "",
        artist: entry.songs?.artist || "",
        duration: entry.songs?.duration
          ? `${Math.floor(entry.songs.duration / 60)}:${(entry.songs.duration % 60).toString().padStart(2, "0")}`
          : "",
        genre: entry.songs?.genre || "",
        year: entry.songs?.year || "",
        bpm: entry.songs?.bpm || "",
        energy: entry.songs?.energy || "",
        mood: entry.songs?.mood || "",
        intro_time: entry.songs?.intro_time || "",
        outro_time: entry.songs?.outro_time || "",
        ...entry.data,
      },
    }))
  }

  const handleRowsChange = (rows: any[]) => {
    // Convert rows back to entries format if needed
    const updatedEntries = rows.map((row, index) => {
      const existingEntry = entries.find((e) => e.id === row.id)
      return {
        ...existingEntry,
        id: row.id,
        position: index + 1,
        data: row.data,
      }
    })
    setEntries(updatedEntries as PlaylistEntry[])
  }

  const handleRowDelete = async (rowId: string) => {
    if (!selectedPlaylist) return

    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", rowId)

      if (error) throw error

      // Update playlist song count
      await supabase
        .from("playlists")
        .update({ song_count: entries.length - 1 })
        .eq("id", selectedPlaylist.id)

      toast({
        title: "Success",
        description: "Entry deleted successfully",
      })

      fetchPlaylistEntries(selectedPlaylist.id)
      fetchPlaylists()
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      })
    }
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playlist.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    )
  }

  if (selectedPlaylist) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToPlaylists}>
              ← Back to Schedules
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedPlaylist.name}
                {selectedEntries.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-600">({selectedEntries.size} selected)</span>
                )}
              </h1>
              {selectedPlaylist.description && <p className="text-gray-600 mt-1">{selectedPlaylist.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  {selectedPlaylist.song_count} songs
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(selectedPlaylist.total_duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Entries Spreadsheet */}
        <div className="bg-white rounded-lg border">
          <SortableSpreadsheet
            columns={columns}
            rows={convertEntriesToRows(entries)}
            onColumnsChange={setColumns}
            onRowsChange={handleRowsChange}
            onRowDelete={handleRowDelete}
            selectedEntries={selectedEntries}
            onSelectEntry={handleSelectEntry}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
            showBulkActions={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduling</h1>
          <p className="text-gray-600 mt-1">Manage your broadcast schedules and playlists</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="generator">AI Schedule Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-6">
          {/* Schedules Grid/List */}
          {filteredPlaylists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                <p className="text-gray-600 text-center mb-4">
                  {searchTerm
                    ? "No schedules match your search criteria."
                    : "Create your first broadcast schedule to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredPlaylists.map((playlist) => (
                <Card key={playlist.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0" onClick={() => handlePlaylistClick(playlist)}>
                        <CardTitle className="text-lg truncate">{playlist.name}</CardTitle>
                        {playlist.description && (
                          <CardDescription className="mt-1 line-clamp-2">{playlist.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlaylistClick(playlist)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePlaylist(playlist.id)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" onClick={() => handlePlaylistClick(playlist)}>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Music className="h-4 w-4" />
                          {playlist.song_count} songs
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(playlist.total_duration)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Schedule
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Updated {new Date(playlist.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generator">
          <ScheduleGenerator onScheduleCreated={fetchPlaylists} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
