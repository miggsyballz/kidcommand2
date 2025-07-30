"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Music, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlaylistEntry {
  id: string
  playlist_id: string | null
  Catergory: string | null
  UID: string | null
  Title: string | null
  Artist: string | null
  Keywords: string | null
  Runs: string | null
  Performnce: number | null
  Era: number | null
  Mood: number | null
  Energy: number | null
  Role: string | null
  Sound: string | null
  Tempo: number | null
  Type: string | null
  created_at: string
}

interface Playlist {
  id: string
  name: string
}

interface EditingCell {
  rowId: string
  column: string
  value: string
}

interface PlaylistEntriesEditorProps {
  selectedPlaylistId?: string
}

export function PlaylistEntriesEditor({ selectedPlaylistId: initialPlaylistId }: PlaylistEntriesEditorProps) {
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(initialPlaylistId || "all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set())

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const { data, error } = await supabase.from("playlists").select("id, name").order("name")

        if (error) throw error
        setPlaylists(data || [])
      } catch (err) {
        console.error("Error fetching playlists:", err)
      }
    }

    fetchPlaylists()
  }, [])

  // Fetch entries based on selected playlist
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from("playlist_entries").select("*").order("created_at", { ascending: false })

      if (selectedPlaylistId !== "all") {
        query = query.eq("playlist_id", selectedPlaylistId)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries")
    } finally {
      setLoading(false)
    }
  }, [selectedPlaylistId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Handle cell edit
  const handleCellEdit = (rowId: string, column: string, currentValue: any) => {
    setEditingCell({
      rowId,
      column,
      value: currentValue?.toString() || "",
    })
  }

  // Handle cell save
  const handleCellSave = async () => {
    if (!editingCell) return

    const { rowId, column, value } = editingCell
    const cellKey = `${rowId}-${column}`

    setSavingCells((prev) => new Set(prev).add(cellKey))

    try {
      // Convert value to appropriate type
      let convertedValue: any = value

      // Handle numeric fields
      if (column === "Performnce" || column === "Tempo") {
        convertedValue = value === "" ? null : Number.parseFloat(value)
        if (isNaN(convertedValue)) convertedValue = null
      } else if (column === "Era" || column === "Mood" || column === "Energy") {
        convertedValue = value === "" ? null : Number.parseInt(value)
        if (isNaN(convertedValue)) convertedValue = null
      } else {
        // Handle text fields
        convertedValue = value === "" ? null : value
      }

      const { error } = await supabase
        .from("playlist_entries")
        .update({ [column]: convertedValue })
        .eq("id", rowId)

      if (error) throw error

      // Update local state
      setEntries((prev) => prev.map((entry) => (entry.id === rowId ? { ...entry, [column]: convertedValue } : entry)))

      setEditingCell(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSavingCells((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cellKey)
        return newSet
      })
    }
  }

  // Handle cell cancel
  const handleCellCancel = () => {
    setEditingCell(null)
  }

  // Handle key press in editing cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave()
    } else if (e.key === "Escape") {
      handleCellCancel()
    }
  }

  // Render editable cell
  const renderEditableCell = (entry: PlaylistEntry, column: keyof PlaylistEntry, value: any) => {
    const isEditing = editingCell?.rowId === entry.id && editingCell?.column === column
    const cellKey = `${entry.id}-${column}`
    const isSaving = savingCells.has(cellKey)

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : null))}
            onKeyDown={handleKeyPress}
            onBlur={handleCellSave}
            autoFocus
            className="h-8 text-xs"
          />
          <Button size="sm" variant="ghost" onClick={handleCellSave} disabled={isSaving} className="h-6 w-6 p-0">
            {isSaving ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] flex items-center"
        onClick={() => handleCellEdit(entry.id, column, value)}
        title="Click to edit"
      >
        {value?.toString() || "-"}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playlist Entries Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Entries ({entries.length})
            </CardTitle>
            {!initialPlaylistId && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filter by Playlist:</label>
                <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select playlist..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Playlists</SelectItem>
                    {playlists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No entries found</h3>
              <p className="text-muted-foreground">
                {selectedPlaylistId === "all"
                  ? "No playlist entries exist yet"
                  : "No entries found for the selected playlist"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">UID</TableHead>
                      <TableHead className="min-w-[150px]">Title</TableHead>
                      <TableHead className="min-w-[120px]">Artist</TableHead>
                      <TableHead className="min-w-[150px]">Keywords</TableHead>
                      <TableHead className="min-w-[80px]">Runs</TableHead>
                      <TableHead className="min-w-[100px]">Performance</TableHead>
                      <TableHead className="min-w-[80px]">Era</TableHead>
                      <TableHead className="min-w-[80px]">Mood</TableHead>
                      <TableHead className="min-w-[80px]">Energy</TableHead>
                      <TableHead className="min-w-[100px]">Role</TableHead>
                      <TableHead className="min-w-[100px]">Sound</TableHead>
                      <TableHead className="min-w-[80px]">Tempo</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                        <TableCell className="text-xs">
                          {renderEditableCell(entry, "Catergory", entry.Catergory)}
                        </TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "UID", entry.UID)}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {renderEditableCell(entry, "Title", entry.Title)}
                        </TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Artist", entry.Artist)}</TableCell>
                        <TableCell className="text-xs">
                          {renderEditableCell(entry, "Keywords", entry.Keywords)}
                        </TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Runs", entry.Runs)}</TableCell>
                        <TableCell className="text-xs">
                          {renderEditableCell(entry, "Performnce", entry.Performnce)}
                        </TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Era", entry.Era)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Mood", entry.Mood)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Energy", entry.Energy)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Role", entry.Role)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Sound", entry.Sound)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Tempo", entry.Tempo)}</TableCell>
                        <TableCell className="text-xs">{renderEditableCell(entry, "Type", entry.Type)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
