"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Music, Plus, Search, Filter, LayoutGrid, List, ArrowLeft } from "lucide-react"
import { SortableSpreadsheet } from "./sortable-spreadsheet"
import { ScheduleGenerator } from "./schedule-generator"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

interface Playlist {
  id: number
  name: string
  description: string | null
  song_count: number
  total_duration: string | null
  created_at: string
  updated_at: string
}

interface PlaylistEntry {
  id: string
  data: Record<string, any>
  position: number
  created_at: string
  playlist_id: number
}

export function SchedulingContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())

  const supabase = createClient()

  // Load playlists
  useEffect(() => {
    loadPlaylists()
  }, [])

  // Clear selection when switching playlists
  useEffect(() => {
    setSelectedEntries(new Set())
  }, [selectedPlaylist])

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase.from("playlists").select("*").order("updated_at", { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error("Error loading playlists:", error)
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const loadPlaylistEntries = async (playlistId: number) => {
    try {
      const { data, error } = await supabase
        .from("playlist_entries")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true })

      if (error) throw error

      const entriesData = data || []
      setEntries(entriesData)

      // Extract columns from data
      if (entriesData.length > 0) {
        const allColumns = new Set<string>()
        entriesData.forEach((entry) => {
          if (entry.data && typeof entry.data === "object") {
            Object.keys(entry.data).forEach((key) => allColumns.add(key))
          }
        })
        setColumns(Array.from(allColumns))
      } else {
        setColumns([])
      }
    } catch (error) {
      console.error("Error loading playlist entries:", error)
      toast.error("Failed to load schedule entries")
    }
  }

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    loadPlaylistEntries(playlist.id)
  }

  const handleBackToSchedules = () => {
    setSelectedPlaylist(null)
    setEntries([])
    setColumns([])
    setSelectedEntries(new Set())
  }

  // Spreadsheet handlers
  const handleEntriesReorder = async (reorderedEntries: PlaylistEntry[]) => {
    try {
      const updates = reorderedEntries.map((entry, index) => ({
        id: entry.id,
        position: index + 1,
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from("playlist_entries")
          .update({ position: update.position })
          .eq("id", update.id)

        if (error) throw error
      }

      setEntries(reorderedEntries)
      toast.success("Schedule entries reordered successfully")
    } catch (error) {
      console.error("Error reordering entries:", error)
      toast.error("Failed to reorder entries")
    }
  }

  const handleColumnsReorder = async (reorderedColumns: string[]) => {
    setColumns(reorderedColumns)
    toast.success("Columns reordered successfully")
  }

  const handleCellEdit = async (entryId: string, column: string, value: any) => {
    try {
      const entry = entries.find((e) => e.id === entryId)
      if (!entry) return

      const updatedData = {
        ...entry.data,
        [column]: value,
      }

      const { error } = await supabase.from("playlist_entries").update({ data: updatedData }).eq("id", entryId)

      if (error) throw error

      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, data: updatedData } : e)))

      toast.success("Cell updated successfully")
    } catch (error) {
      console.error("Error updating cell:", error)
      toast.error("Failed to update cell")
    }
  }

  const handleHeaderEdit = async (oldColumn: string, newColumn: string) => {
    if (oldColumn === newColumn) return

    try {
      const updatedEntries = entries.map((entry) => {
        const newData = { ...entry.data }
        if (oldColumn in newData) {
          newData[newColumn] = newData[oldColumn]
          delete newData[oldColumn]
        }
        return { ...entry, data: newData }
      })

      // Update all entries in database
      for (const entry of updatedEntries) {
        const { error } = await supabase.from("playlist_entries").update({ data: entry.data }).eq("id", entry.id)

        if (error) throw error
      }

      setEntries(updatedEntries)
      setColumns((prev) => prev.map((col) => (col === oldColumn ? newColumn : col)))
      toast.success("Column renamed successfully")
    } catch (error) {
      console.error("Error renaming column:", error)
      toast.error("Failed to rename column")
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries((prev) => prev.filter((e) => e.id !== entryId))

      // Update playlist song count
      if (selectedPlaylist) {
        const newCount = entries.length - 1
        await supabase.from("playlists").update({ song_count: newCount }).eq("id", selectedPlaylist.id)

        setSelectedPlaylist((prev) => (prev ? { ...prev, song_count: newCount } : null))
      }

      // Remove from selection if selected
      setSelectedEntries((prev) => {
        const newSet = new Set(prev)
        newSet.delete(Number(entryId))
        return newSet
      })

      toast.success("Entry deleted successfully")
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast.error("Failed to delete entry")
    }
  }

  const handleAddColumn = async () => {
    const newColumnName = `Column ${columns.length + 1}`
    setColumns((prev) => [...prev, newColumnName])
    toast.success("New column added")
  }

  const getEntryValue = (entry: PlaylistEntry, column: string): string => {
    if (!entry.data || typeof entry.data !== "object") return "-"
    const value = entry.data[column]
    return value !== undefined && value !== null ? String(value) : "-"
  }

  // Bulk selection handlers
  const handleSelectEntry = (entryId: number, checked: boolean) => {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(entryId)
      } else {
        newSet.delete(entryId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = entries.map((entry) => Number(entry.id))
      setSelectedEntries(new Set(allIds))
    } else {
      setSelectedEntries(new Set())
    }
  }

  const handleBulkDelete = async (entryIds: number[]) => {
    try {
      // Delete entries from database
      const { error } = await supabase.from("playlist_entries").delete().in("id", entryIds.map(String))

      if (error) throw error

      // Update local state
      setEntries((prev) => prev.filter((entry) => !entryIds.includes(Number(entry.id))))

      // Update playlist song count
      if (selectedPlaylist) {
        const newCount = entries.length - entryIds.length
        await supabase.from("playlists").update({ song_count: newCount }).eq("id", selectedPlaylist.id)

        setSelectedPlaylist((prev) => (prev ? { ...prev, song_count: newCount } : null))
      }

      // Clear selection
      setSelectedEntries(new Set())

      toast.success(`${entryIds.length} entries deleted successfully`)
    } catch (error) {
      console.error("Error bulk deleting entries:", error)
      toast.error("Failed to delete selected entries")
    }
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (playlist.description && playlist.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </div>
    )
  }

  // Show individual schedule view
  if (selectedPlaylist) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToSchedules} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Schedules
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedPlaylist.name}</h1>
              <p className="text-muted-foreground">
                {selectedEntries.size > 0
                  ? `${selectedEntries.size} of ${entries.length} entries selected`
                  : `${entries.length} entries • ${selectedPlaylist.total_duration || "No duration"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
        </div>

        {/* Schedule Spreadsheet */}
        <SortableSpreadsheet
          entries={entries}
          columns={columns}
          onEntriesReorder={handleEntriesReorder}
          onColumnsReorder={handleColumnsReorder}
          onCellEdit={handleCellEdit}
          onHeaderEdit={handleHeaderEdit}
          onDeleteEntry={handleDeleteEntry}
          onAddColumn={handleAddColumn}
          getEntryValue={getEntryValue}
          selectedEntries={selectedEntries}
          onSelectEntry={handleSelectEntry}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          showBulkActions={true}
        />
      </div>
    )
  }

  // Show schedules list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-muted-foreground">Manage your broadcast schedules and programming</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Schedules Grid/List */}
      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Create your first broadcast schedule to get started"}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      ) : (
        <div className={viewMode === "card" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredPlaylists.map((playlist) => (
            <Card
              key={playlist.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                viewMode === "list" ? "flex items-center p-4" : ""
              }`}
              onClick={() => handlePlaylistSelect(playlist)}
            >
              {viewMode === "card" ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <Badge variant="secondary">{playlist.song_count} entries</Badge>
                    </div>
                    {playlist.description && <CardDescription>{playlist.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {playlist.total_duration || "No duration"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(playlist.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{playlist.name}</h3>
                      {playlist.description && <p className="text-sm text-muted-foreground">{playlist.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{playlist.song_count} entries</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {playlist.total_duration || "No duration"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(playlist.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* AI Schedule Generator */}
      <div className="mt-8">
        <ScheduleGenerator onScheduleGenerated={loadPlaylists} />
      </div>
    </div>
  )
}
