"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Save, X, Plus, Music, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Song {
  id: number
  data: Record<string, any>
  playlist_id?: number
  source_file?: string
  created_at: string
}

interface Playlist {
  id: number
  name: string
  description?: string
  song_count: number
}

export function LibraryContent() {
  const [songs, setSongs] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ songId: number; column: string } | null>(null)
  const [editingHeader, setEditingHeader] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [columns, setColumns] = useState<string[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedPlaylist])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select("id, name, description, song_count")
        .order("name")

      if (playlistsError) {
        console.error("Error fetching playlists:", playlistsError)
        throw playlistsError
      }

      setPlaylists(playlistsData || [])

      // Fetch songs
      let query = supabase
        .from("playlist_entries")
        .select("id, data, playlist_id, source_file, created_at")
        .order("created_at", { ascending: false })

      if (selectedPlaylist) {
        query = query.eq("playlist_id", selectedPlaylist)
      }

      const { data: songsData, error: songsError } = await query

      if (songsError) {
        console.error("Error fetching songs:", songsError)
        throw songsError
      }

      console.log("Raw songs data:", songsData)

      // Process and filter songs
      const processedSongs = (songsData || [])
        .filter((song) => {
          // Filter out songs with invalid data
          if (!song.data || typeof song.data !== "object") {
            console.warn("Filtering out song with invalid data:", song)
            return false
          }
          return true
        })
        .map((song) => {
          // Ensure data is an object
          let data = song.data
          if (typeof data === "string") {
            try {
              data = JSON.parse(data)
            } catch (e) {
              console.warn("Failed to parse song data:", song.id, e)
              return null
            }
          }
          return { ...song, data }
        })
        .filter(Boolean) as Song[]

      console.log("Processed songs:", processedSongs)

      setSongs(processedSongs)

      // Extract unique columns from all songs
      const allColumns = new Set<string>()
      processedSongs.forEach((song) => {
        if (song.data && typeof song.data === "object") {
          Object.keys(song.data).forEach((key) => {
            if (key && key.trim()) {
              allColumns.add(key)
            }
          })
        }
      })

      const columnArray = Array.from(allColumns).sort()
      console.log("Extracted columns:", columnArray)
      setColumns(columnArray)
    } catch (err) {
      console.error("Error in fetchData:", err)
      setError(err instanceof Error ? err.message : "An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  const getSongValue = (song: Song, column: string): string => {
    if (!song.data || typeof song.data !== "object") {
      return "-"
    }

    const value = song.data[column]

    if (value === null || value === undefined || value === "") {
      return "-"
    }

    // Handle time formatting for Runtime columns
    if (column.toLowerCase().includes("runtime") || column.toLowerCase().includes("duration")) {
      if (typeof value === "number") {
        // Convert decimal to mm:ss format
        const totalSeconds = Math.round(value * 24 * 60 * 60)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
      }
    }

    return String(value)
  }

  const handleCellEdit = (songId: number, column: string, currentValue: string) => {
    setEditingCell({ songId, column })
    setEditValue(currentValue === "-" ? "" : currentValue)
  }

  const handleHeaderEdit = (column: string) => {
    setEditingHeader(column)
    setEditValue(column)
  }

  const saveCellEdit = async () => {
    if (!editingCell) return

    try {
      const song = songs.find((s) => s.id === editingCell.songId)
      if (!song) return

      const updatedData = {
        ...song.data,
        [editingCell.column]: editValue || null,
      }

      const { error } = await supabase
        .from("playlist_entries")
        .update({ data: updatedData })
        .eq("id", editingCell.songId)

      if (error) throw error

      // Update local state
      setSongs((prev) => prev.map((s) => (s.id === editingCell.songId ? { ...s, data: updatedData } : s)))

      setEditingCell(null)
      setEditValue("")
    } catch (err) {
      console.error("Error updating cell:", err)
      setError("Failed to update cell")
    }
  }

  const saveHeaderEdit = async () => {
    if (!editingHeader || !editValue.trim()) return

    try {
      // Update all songs to rename the column
      const updates = songs.map(async (song) => {
        if (!song.data || typeof song.data !== "object") return

        const newData = { ...song.data }
        if (editingHeader in newData) {
          newData[editValue] = newData[editingHeader]
          delete newData[editingHeader]

          const { error } = await supabase.from("playlist_entries").update({ data: newData }).eq("id", song.id)

          if (error) throw error
        }
      })

      await Promise.all(updates)

      // Update local state
      setColumns((prev) => prev.map((col) => (col === editingHeader ? editValue : col)))

      setSongs((prev) =>
        prev.map((song) => {
          if (!song.data || typeof song.data !== "object") return song
          const newData = { ...song.data }
          if (editingHeader in newData) {
            newData[editValue] = newData[editingHeader]
            delete newData[editingHeader]
          }
          return { ...song, data: newData }
        }),
      )

      setEditingHeader(null)
      setEditValue("")
    } catch (err) {
      console.error("Error updating header:", err)
      setError("Failed to update column header")
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditingHeader(null)
    setEditValue("")
  }

  const deleteSong = async (songId: number) => {
    if (!confirm("Are you sure you want to delete this song?")) return

    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", songId)

      if (error) throw error

      setSongs((prev) => prev.filter((s) => s.id !== songId))
    } catch (err) {
      console.error("Error deleting song:", err)
      setError("Failed to delete song")
    }
  }

  const addColumn = async () => {
    const columnName = prompt("Enter new column name:")
    if (!columnName || !columnName.trim()) return

    const trimmedName = columnName.trim()
    if (columns.includes(trimmedName)) {
      alert("Column already exists!")
      return
    }

    setColumns((prev) => [...prev, trimmedName].sort())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading library...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Environment Setup Required:</h4>
            <p className="text-sm mb-2">Make sure you have these environment variables in your .env.local file:</p>
            <pre className="bg-red-100 p-2 rounded text-xs">
              NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url{"\n"}
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
            </pre>
            <p className="text-xs mt-2">Get these from your Supabase dashboard → Settings → API</p>
          </div>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Music className="h-8 w-8" />
            Music Library
          </h1>
          <p className="text-muted-foreground">
            {songs.length} entries • {columns.length} columns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={addColumn} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Playlist Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedPlaylist === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPlaylist(null)}
        >
          All Songs ({songs.length})
        </Button>
        {playlists.map((playlist) => (
          <Button
            key={playlist.id}
            variant={selectedPlaylist === playlist.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlaylist(playlist.id)}
          >
            {playlist.name} ({playlist.song_count})
          </Button>
        ))}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-600 text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>
              <strong>Songs loaded:</strong> {songs.length}
            </p>
            <p>
              <strong>Columns detected:</strong> {columns.join(", ")}
            </p>
            <p>
              <strong>Sample data structure:</strong>
            </p>
            <pre className="bg-blue-100 p-2 rounded mt-2 overflow-auto max-h-32">
              {JSON.stringify(songs[0]?.data || {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Library Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Entries ({songs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No songs found in your library.</p>
              <p className="text-sm">Upload some data to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">#</th>
                    {columns.map((column) => (
                      <th key={column} className="text-left p-2 font-medium min-w-[120px]">
                        {editingHeader === column ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs"
                              onKeyPress={(e) => e.key === "Enter" && saveHeaderEdit()}
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveHeaderEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <span>{column}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 opacity-0 group-hover:opacity-100"
                              onClick={() => handleHeaderEdit(column)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="text-left p-2 font-medium">Created</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song, index) => (
                    <tr key={song.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm text-muted-foreground">{index + 1}</td>
                      {columns.map((column) => {
                        const value = getSongValue(song, column)
                        const isEditing = editingCell?.songId === song.id && editingCell?.column === column

                        return (
                          <td key={column} className="p-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-6 text-xs"
                                  onKeyPress={(e) => e.key === "Enter" && saveCellEdit()}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveCellEdit}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="text-sm cursor-pointer hover:bg-muted/50 p-1 rounded group"
                                onClick={() => handleCellEdit(song.id, column, value)}
                              >
                                <span className={value === "-" ? "text-muted-foreground" : ""}>{value}</span>
                                <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 inline" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(song.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                          onClick={() => deleteSong(song.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
