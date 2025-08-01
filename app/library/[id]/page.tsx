"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Music, AlertCircle, Edit2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SortableSpreadsheet } from "@/components/sortable-spreadsheet"
import { getCellDisplayValue } from "@/lib/duration-utils"

interface PlaylistEntry {
  id: string
  data: Record<string, any>
  playlist_id: string
  source_file?: string
  position: number
  created_at: string
  updated_at?: string
}

interface Playlist {
  id: string
  name: string
  song_count: number
  status: "active" | "draft" | "archived"
  prompt?: string
  source_file?: string
  date_created?: string
  column_structure?: string
  created_at: string
  updated_at?: string
}

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<string[]>([])

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        // Fetch playlist info
        const { data: playlistData, error: playlistError } = await supabase
          .from("playlists")
          .select("*")
          .eq("id", playlistId)
          .single()

        if (playlistError) throw playlistError
        setPlaylist(playlistData)

        // Fetch playlist entries ordered by position
        const { data: entriesData, error: entriesError } = await supabase
          .from("playlist_entries")
          .select("*")
          .eq("playlist_id", playlistId)
          .order("position", { ascending: true })

        if (entriesError) throw entriesError

        // Process entries to ensure data is properly formatted
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

        setEntries(processedEntries)

        // Determine columns to display
        let columnsToUse: string[] = []

        // First, try to use column_structure from playlist
        if (playlistData.column_structure) {
          try {
            const parsedStructure = JSON.parse(playlistData.column_structure)
            if (Array.isArray(parsedStructure)) {
              columnsToUse = parsedStructure
            }
          } catch (e) {
            console.warn("Failed to parse column_structure:", e)
          }
        }

        // If no column_structure or parsing failed, infer from entry data
        if (columnsToUse.length === 0) {
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
          columnsToUse = Array.from(allColumns).sort()
        }

        setColumns(columnsToUse)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load playlist")
      } finally {
        setLoading(false)
      }
    }

    if (playlistId) {
      fetchPlaylistData()
    }
  }, [playlistId])

  const getEntryValue = (entry: PlaylistEntry, column: string): string => {
    if (!entry.data || typeof entry.data !== "object") {
      return "-"
    }

    const value = entry.data[column]
    return getCellDisplayValue(value, column)
  }

  const handleEntriesReorder = async (newEntries: PlaylistEntry[]) => {
    setEntries(newEntries)

    try {
      const updates = newEntries.map((entry) => ({
        id: entry.id,
        position: entry.position,
        playlist_id: entry.playlist_id, // Ensure playlist_id is included
      }))

      const { error } = await supabase.from("playlist_entries").upsert(updates, { onConflict: "id" })

      if (error) throw error
    } catch (err) {
      console.error("Error updating entry positions:", err)
      setError("Failed to update entry order")
    }
  }

  const handleColumnsReorder = async (newColumns: string[]) => {
    setColumns(newColumns)

    try {
      await supabase
        .from("playlists")
        .update({ column_structure: JSON.stringify(newColumns) })
        .eq("id", playlistId)
    } catch (err) {
      console.error("Error updating column order:", err)
      setError("Failed to update column order")
    }
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

      // Update local state
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, data: updatedData } : e)))
    } catch (err) {
      console.error("Error updating cell:", err)
      throw err
    }
  }

  const handleHeaderEdit = async (oldColumn: string, newColumn: string) => {
    try {
      // Update all entries to rename the column
      const updates = entries.map(async (entry) => {
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

      // Update playlist column_structure
      const newColumns = columns.map((col) => (col === oldColumn ? newColumn : col))
      await supabase
        .from("playlists")
        .update({ column_structure: JSON.stringify(newColumns) })
        .eq("id", playlistId)

      // Update local state
      setColumns(newColumns)

      setEntries((prev) =>
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
    } catch (err) {
      console.error("Error updating header:", err)
      throw err
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries((prev) => prev.filter((e) => e.id !== entryId))

      // Update playlist song count
      if (playlist) {
        await supabase
          .from("playlists")
          .update({ song_count: playlist.song_count - 1 })
          .eq("id", playlistId)

        setPlaylist((prev) => (prev ? { ...prev, song_count: prev.song_count - 1 } : null))
      }
    } catch (err) {
      console.error("Error deleting entry:", err)
      setError("Failed to delete entry")
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

    // Update playlist column_structure
    await supabase
      .from("playlists")
      .update({ column_structure: JSON.stringify(newColumns) })
      .eq("id", playlistId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Playlist Not Found</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "The requested playlist could not be found."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Music className="h-8 w-8" />
              {playlist.name}
            </h1>
            <p className="text-muted-foreground">
              {entries.length} entries • {columns.length} columns • Created{" "}
              {new Date(playlist.created_at || playlist.date_created || "").toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push(`/playlists/${playlistId}/edit`)} variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Playlist
          </Button>
        </div>
      </div>

      {/* Playlist Spreadsheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SortableSpreadsheet
            entries={entries.map((entry) => ({
              id: entry.id,
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
        </CardContent>
      </Card>
    </div>
  )
}
