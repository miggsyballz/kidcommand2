"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, AlertCircle, Upload, CheckCircle2, FileText, X, Info, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"
import { useRef } from "react"
import { SortableSpreadsheet } from "./sortable-spreadsheet"
import { getCellDisplayValue } from "@/lib/duration-utils"
import * as XLSX from "xlsx"

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

interface DuplicateInfo {
  found: number
  skipped: number
  uploaded: number
  duplicates: Array<{ title: string; artist: string }>
}

export function LibraryContent() {
  const [songs, setSongs] = useState<Song[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("new")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

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

      // Fetch all songs (no playlist filtering)
      const { data: songsData, error: songsError } = await supabase
        .from("playlist_entries")
        .select("id, data, playlist_id, source_file, position, created_at")
        .order("position", { ascending: true })

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

      // Extract columns from all songs data
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
      const columnsToUse = Array.from(allColumns).sort()

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
    const duplicates: Array<{ title: string; artist: string; row: any }> = []

    for (const entry of entries) {
      const title = entry.Title || entry.title || ""
      const artist = entry.Artist || entry.artist || ""

      // Skip entries without both title and artist
      if (!title.trim() || !artist.trim()) continue

      // Check if this combination already exists in the database
      const { data, error } = await supabase
        .from("playlist_entries")
        .select("id")
        .ilike("data->>Title", title.trim())
        .ilike("data->>Artist", artist.trim())
        .limit(1)

      if (!error && data && data.length > 0) {
        duplicates.push({ title: title.trim(), artist: artist.trim(), row: entry })
      }
    }

    return duplicates
  }

  const handleUpload = async () => {
    if (!selectedFile || !csvData.length) return setUploadError("No file or data loaded.")

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      // Check for duplicates first
      const duplicates = await checkForDuplicates(csvData)
      const duplicateSet = new Set(duplicates.map((d) => `${d.title.toLowerCase()}-${d.artist.toLowerCase()}`))

      // Filter out duplicates
      const uniqueEntries = csvData.filter((row) => {
        const title = (row.Title || row.title || "").trim().toLowerCase()
        const artist = (row.Artist || row.artist || "").trim().toLowerCase()
        return !duplicateSet.has(`${title}-${artist}`)
      })

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

      const entries = uniqueEntries.map((row, index) => ({
        playlist_id: playlistId,
        source_file: selectedFile.name,
        position: index + 1,
        data: row,
      }))

      if (entries.length > 0) {
        const { error: insertError } = await supabase.from("playlist_entries").insert(entries)
        if (insertError) throw new Error(insertError.message)

        await supabase.from("playlists").update({ song_count: entries.length }).eq("id", playlistId)
      }

      // Set duplicate info for dialog
      const duplicateInfo: DuplicateInfo = {
        found: csvData.length,
        skipped: duplicates.length,
        uploaded: entries.length,
        duplicates: duplicates.map((d) => ({ title: d.title, artist: d.artist })),
      }

      setDuplicateInfo(duplicateInfo)

      if (duplicates.length > 0) {
        setShowDuplicateDialog(true)
      } else {
        setUploadSuccess(`Successfully uploaded ${entries.length} songs.`)
      }

      // Refresh the data
      await fetchData()

      // Clear form after successful upload
      setTimeout(() => {
        setSelectedFile(null)
        setCsvData([])
        setHeaders([])
        fileInputRef.current?.value && (fileInputRef.current.value = "")
        if (duplicates.length === 0) {
          setUploadSuccess(null)
        }
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
    } catch (err) {
      console.error("Error updating header:", err)
      throw err
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from("playlist_entries").delete().eq("id", entryId)

      if (error) throw error

      setSongs((prev) => prev.filter((s) => s.id !== Number(entryId)))
      setSelectedSongs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(Number(entryId))
        return newSet
      })
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
  }

  const handleCloseDuplicateDialog = () => {
    setShowDuplicateDialog(false)
    if (duplicateInfo) {
      setUploadSuccess(
        `Successfully uploaded ${duplicateInfo.uploaded} songs. ${duplicateInfo.skipped} duplicates were skipped.`,
      )
    }
    setDuplicateInfo(null)
  }

  const handleSelectSong = (songId: number, checked: boolean) => {
    setSelectedSongs((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(songId)
      } else {
        newSet.delete(songId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSongs(new Set(songs.map((song) => song.id)))
    } else {
      setSelectedSongs(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedSongs.size === 0) return

    try {
      const songIds = Array.from(selectedSongs)
      const { error } = await supabase.from("playlist_entries").delete().in("id", songIds)

      if (error) throw error

      setSongs((prev) => prev.filter((song) => !selectedSongs.has(song.id)))
      setSelectedSongs(new Set())
      setShowBulkDeleteDialog(false)
      setUploadSuccess(`Successfully deleted ${songIds.length} songs.`)

      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (err) {
      console.error("Error deleting songs:", err)
      setError("Failed to delete selected songs")
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
      {/* Duplicate Detection Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Duplicate Songs Detected
            </DialogTitle>
            <DialogDescription>
              Some songs in your upload already exist in the library and were automatically skipped.
            </DialogDescription>
          </DialogHeader>

          {duplicateInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{duplicateInfo.found}</div>
                  <div className="text-sm text-blue-600">Total Songs</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{duplicateInfo.uploaded}</div>
                  <div className="text-sm text-green-600">Uploaded</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{duplicateInfo.skipped}</div>
                  <div className="text-sm text-orange-600">Skipped</div>
                </div>
              </div>

              {duplicateInfo.duplicates.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Skipped Duplicates:</h4>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Artist</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duplicateInfo.duplicates.map((duplicate, index) => (
                          <TableRow key={index}>
                            <TableCell>{duplicate.title}</TableCell>
                            <TableCell>{duplicate.artist}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseDuplicateDialog}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Songs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSongs.size} selected songs? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete {selectedSongs.size} Songs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Music className="h-8 w-8" />
            Music Library
          </h1>
          <p className="text-muted-foreground">
            {songs.length} total songs • {columns.length} columns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSongs.size > 0 && (
            <Button
              onClick={() => setShowBulkDeleteDialog(true)}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedSongs.size})
            </Button>
          )}
          <Button onClick={fetchData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

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
                  <span onClick={() => fileInputRef.current?.click()} className="text-primary cursor-pointer underline">
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

      {/* Library Spreadsheet with Bulk Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              All Songs ({songs.length})
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSongs.size === songs.length && songs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
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
            selectedEntries={selectedSongs}
            onSelectEntry={handleSelectSong}
            onSelectAll={handleSelectAll}
          />
        </CardContent>
      </Card>
    </div>
  )
}
