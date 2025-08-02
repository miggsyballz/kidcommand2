"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, AlertCircle, Upload, CheckCircle2, FileText, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useRef } from "react"
import { SortableSpreadsheet } from "./sortable-spreadsheet"
import { getCellDisplayValue } from "@/lib/duration-utils"
import * as XLSX from "xlsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Song {
  id: number
  data: Record<string, any>
  playlist_id?: number
  source_file?: string
  position: number
  created_at: string
}

interface Playlist {
  id: number
  name: string
  description?: string
  song_count: number
  column_structure?: string
}

export function LibraryContent() {
  const [songs, setSongs] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("new")
  const [deduplicateMode, setDeduplicateMode] = useState<"skip" | "create">("skip")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        .select("id, name, description, song_count, column_structure")
        .order("name")

      if (playlistsError) {
        console.error("Error fetching playlists:", playlistsError)
        throw playlistsError
      }

      setPlaylists(playlistsData || [])

      // Fetch songs
      let query = supabase
        .from("playlist_entries")
        .select("id, data, playlist_id, source_file, position, created_at")
        .order("position", { ascending: true })

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
          return { ...song, data, position: song.position || 0 }
        })
        .filter(Boolean) as Song[]

      console.log("Processed songs:", processedSongs)

      setSongs(processedSongs)

      // Extract columns from playlist structure or infer from data
      let columnsToUse: string[] = []

      if (selectedPlaylist) {
        const playlist = playlistsData?.find((p) => p.id === selectedPlaylist)
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
      }

      // If no column structure, infer from data
      if (columnsToUse.length === 0) {
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
        columnsToUse = Array.from(allColumns).sort()
      }

      console.log("Extracted columns:", columnsToUse)
      setColumns(columnsToUse)
    } catch (err) {
      console.error("Error in fetchData:", err)
      setError(err instanceof Error ? err.message : "An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  // Upload functions
  const handleFile = async (file: File) => {
    const isCSV = file.name.endsWith(".csv")
    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
    if (!isCSV && !isXLSX) return setUploadError("Only CSV or Excel files are supported.")
    setSelectedFile(file)
    setUploadError(null)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" })
      const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[]
      setHeaders(headerRow)
      setCsvData(json as any[])
    } catch (e) {
      setUploadError("Failed to parse file.")
    }
  }

  const checkForDuplicates = async (entries: any[]) => {
    const duplicates = []
    for (const entry of entries) {
      if (!entry.Title && !entry.Artist) continue
      const { data, error } = await supabase
        .from("playlist_entries")
        .select("id")
        .eq("Title", entry.Title)
        .eq("Artist", entry.Artist)
        .limit(1)
      if (!error && data && data.length > 0) duplicates.push(entry)
    }
    return duplicates
  }

  const handleUpload = async () => {
    if (!selectedFile || !csvData.length) return setUploadError("No file or data loaded.")

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      let playlistId = selectedPlaylistId
      if (!playlistId || playlistId === "new") {
        const { data: playlist, error } = await supabase
          .from("playlists")
          .insert({
            name: selectedFile.name.replace(/\.[^/.]+$/, ""),
            status: "active",
            source_file: selectedFile.name,
            song_count: 0,
            column_structure: JSON.stringify(headers),
          })
          .select()
          .single()
        if (error || !playlist) throw new Error(error?.message || "Could not create playlist")
        playlistId = playlist.id
      }

      let entries = csvData.map((row, index) => ({
        playlist_id: playlistId,
        source_file: selectedFile.name,
        position: index + 1,
        data: row,
      }))

      if (deduplicateMode === "skip") {
        const duplicates = await checkForDuplicates(csvData)
        const duplicateSet = new Set(duplicates.map((d) => `${d.Title}-${d.Artist}`))
        entries = entries.filter((e) => !duplicateSet.has(`${e.data.Title}-${e.data.Artist}`))
      }

      const { error: insertError } = await supabase.from("playlist_entries").insert(entries)
      if (insertError) throw new Error(insertError.message)

      await supabase.from("playlists").update({ song_count: entries.length }).eq("id", playlistId)

      setUploadSuccess(`Uploaded ${entries.length} songs successfully.`)

      // Refresh the data
      await fetchData()

      setTimeout(() => {
        setSelectedFile(null)
        setCsvData([])
        setHeaders([])
        fileInputRef.current?.value && (fileInputRef.current.value = "")
        setUploadSuccess(null)
      }, 3000)
    } catch (err) {
      console.error(err)
      setUploadError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const getSongValue = (song: Song, column: string): string => {
    if (!song.data || typeof song.data !== "object") {
      return "-"
    }

    const value = song.data[column]
    return getCellDisplayValue(value, column)
  }

  const handleEntriesReorder = async (newEntries: Song[]) => {
    setSongs(newEntries)

    try {
      // Only update entries that have a playlist_id
      const validEntries = newEntries.filter((entry) => entry.playlist_id)

      if (validEntries.length === 0) {
        console.warn("No entries with playlist_id found for reordering")
        return
      }

      const updates = validEntries.map((entry) => ({
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
      if (selectedPlaylist) {
        await supabase
          .from("playlists")
          .update({ column_structure: JSON.stringify(newColumns) })
          .eq("id", selectedPlaylist)
      }
    } catch (err) {
      console.error("Error updating column order:", err)
      setError("Failed to update column order")
    }
  }

  const handleCellEdit = async (entryId: string, column: string, value: any) => {
    try {
      const song = songs.find((s) => s.id === Number(entryId))
      if (!song) return

      const updatedData = {
        ...song.data,
        [column]: value,
      }

      const { error } = await supabase.from("playlist_entries").update({ data: updatedData }).eq("id", entryId)

      if (error) throw error

      // Update local state
      setSongs((prev) => prev.map((s) => (s.id === Number(entryId) ? { ...s, data: updatedData } : s)))
    } catch (err) {
      console.error("Error updating cell:", err)
      throw err
    }
  }

  const handleHeaderEdit = async (oldColumn: string, newColumn: string) => {
    try {
      // Update all songs to rename the column
      const updates = songs.map(async (song) => {
        if (!song.data || typeof song.data !== "object") return

        const newData = { ...song.data }
        if (oldColumn in newData) {
          newData[newColumn] = newData[oldColumn]
          delete newData[oldColumn]

          const { error } = await supabase.from("playlist_entries").update({ data: newData }).eq("id", song.id)

          if (error) throw error
        }
      })

      await Promise.all(updates)

      // Update local state
      setColumns((prev) => prev.map((col) => (col === oldColumn ? newColumn : col)))

      setSongs((prev) =>
        prev.map((song) => {
          if (!song.data || typeof song.data !== "object") return song
          const newData = { ...song.data }
          if (oldColumn in newData) {
            newData[newColumn] = newData[oldColumn]
            delete newData[oldColumn]
          }
          return { ...song, data: newData }
        }),
      )

      // Update column structure if playlist is selected
      if (selectedPlaylist) {
        const newColumns = columns.map((col) => (col === oldColumn ? newColumn : col))
        await supabase
          .from("playlists")
          .update({ column_structure: JSON.stringify(newColumns) })
          .eq("id", selectedPlaylist)
      }
    } catch (err) {
      console.error("Error updating header:", err)
      throw err
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return

    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", entryId)

      if (error) throw error

      setSongs((prev) => prev.filter((s) => s.id !== Number(entryId)))
    } catch (err) {
      console.error("Error deleting song:", err)
      setError("Failed to delete song")
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

    // Update column structure if playlist is selected
    if (selectedPlaylist) {
      await supabase
        .from("playlists")
        .update({ column_structure: JSON.stringify(newColumns) })
        .eq("id", selectedPlaylist)
    }
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
          <Button onClick={fetchData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for Browse and Upload */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Music</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
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

          {/* Library Spreadsheet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Entries ({songs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SortableSpreadsheet
                entries={songs.map((song) => ({
                  id: song.id.toString(),
                  data: song.data,
                  position: song.position,
                  created_at: song.created_at,
                  playlist_id: song.playlist_id,
                }))}
                columns={columns}
                onEntriesReorder={handleEntriesReorder}
                onColumnsReorder={handleColumnsReorder}
                onCellEdit={handleCellEdit}
                onHeaderEdit={handleHeaderEdit}
                onDeleteEntry={handleDeleteEntry}
                onAddColumn={handleAddColumn}
                getEntryValue={(entry, column) => getSongValue(entry as any, column)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Music Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {uploadSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">{uploadSuccess}</AlertDescription>
                </Alert>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add to Playlist</label>
                  <Select onValueChange={(val) => setSelectedPlaylistId(val)} defaultValue="new">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Create New Playlist
                        </div>
                      </SelectItem>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duplicate Handling</label>
                  <Select onValueChange={(val: "skip" | "create") => setDeduplicateMode(val)} defaultValue="skip">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip Duplicates</SelectItem>
                      <SelectItem value="create">Create Anyway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative border-2 border-dashed rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-left text-green-600">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {csvData.length} rows • {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null)
                        setCsvData([])
                        setHeaders([])
                        setUploadError(null)
                        setUploadSuccess(null)
                        fileInputRef.current?.value && (fileInputRef.current.value = "")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm">
                      Drop CSV or Excel file here or{" "}
                      <span
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary cursor-pointer underline"
                      >
                        browse
                      </span>
                    </p>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {csvData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <h4 className="font-medium text-sm">Data Preview (First 5 Rows)</h4>
                  </div>
                  <div className="border rounded-md overflow-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {headers.map((h, j) => (
                              <TableCell key={j} className="max-w-[200px] truncate">
                                {getCellDisplayValue(row[h], h)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleUpload} disabled={isUploading || !csvData.length} size="lg" className="min-w-40">
                  {isUploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload to Library
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
