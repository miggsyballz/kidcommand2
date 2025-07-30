"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Upload, FileText, X, AlertCircle, CheckCircle2, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface CSVRow {
  [key: string]: string
}

interface PlaylistEntry {
  playlist_id?: string
  title?: string
  artist?: string
  genre?: string
  year?: number
  duration?: string
  bpm?: number
  album?: string
}

interface UploadDataContentProps {
  onPlaylistCreated?: () => void
}

export function UploadDataContent({ onPlaylistCreated }: UploadDataContentProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>("new")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .order("created_at", { ascending: false })
      if (!error && data) {
        setPlaylists(data)
      }
    }

    fetchPlaylists()
  }, [])

  const mapRowToPlaylistEntry = (row: CSVRow): PlaylistEntry => {
    const entry: PlaylistEntry = {}

    // Column mappings using lowercase column names (standard database convention)
    const columnMappings: { [key: string]: keyof PlaylistEntry } = {
      // Title mappings
      title: "title",
      song: "title",
      name: "title",
      track: "title",

      // Artist mappings
      artist: "artist",
      performer: "artist",
      musician: "artist",

      // Genre mappings
      genre: "genre",
      category: "genre",
      style: "genre",

      // Year mappings
      year: "year",
      era: "year",
      decade: "year",

      // Duration mappings
      duration: "duration",
      length: "duration",
      time: "duration",
      runs: "duration",

      // BPM mappings
      bpm: "bpm",
      tempo: "bpm",
      speed: "bpm",

      // Album mappings
      album: "album",
      record: "album",
      release: "album",
    }

    for (const key of Object.keys(row)) {
      const normalizedKey = key.toLowerCase().trim()
      const field = columnMappings[normalizedKey]
      if (field) {
        const value = row[key]?.trim()
        if (!value) continue

        // Handle numeric fields
        if (field === "year" || field === "bpm") {
          const num = Number.parseInt(value)
          if (!isNaN(num)) {
            entry[field] = num
          }
        } else {
          // Handle text fields
          entry[field] = value
        }
      }
    }

    return entry
  }

  const parseCSV = useCallback((text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (!lines.length) throw new Error("CSV file is empty")

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data: CSVRow[] = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: CSVRow = {}
        headers.forEach((h, i) => (row[h] = values[i] || ""))
        return row
      })
      .filter((row) => Object.values(row).some((v) => v !== ""))

    return { headers, data }
  }, [])

  const parseXLSX = useCallback(async (file: File) => {
    const XLSX = await import("xlsx")
    return new Promise<{ headers: string[]; data: CSVRow[] }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]
          const headers = json[0].map((h) => String(h).trim())
          const rows: CSVRow[] = json
            .slice(1)
            .map((row) => {
              const obj: CSVRow = {}
              headers.forEach((h, i) => (obj[h] = String(row[i] || "").trim()))
              return obj
            })
            .filter((row) => Object.values(row).some((v) => v !== ""))
          resolve({ headers, data: rows })
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error("Failed to read XLSX file"))
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(null)
    const isCSV = file.name.endsWith(".csv")
    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")

    if (!isCSV && !isXLSX) return setError("Only .csv or .xlsx files are supported.")
    if (file.size > 10 * 1024 * 1024) return setError("File must be under 10MB.")

    try {
      const { headers, data } = isCSV ? parseCSV(await file.text()) : await parseXLSX(file)
      setSelectedFile(file)
      setCsvHeaders(headers)
      setCsvData(data)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file.")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !csvData.length) {
      setError("No file or data loaded.")
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      let playlistIdToUse = selectedPlaylistId

      if (!playlistIdToUse || playlistIdToUse === "new") {
        // Create new playlist
        const { data: playlist, error: playlistError } = await supabase
          .from("playlists")
          .insert({
            name: selectedFile.name.replace(/\.[^/.]+$/, ""),
            status: "active",
            song_count: 0,
            source_file: selectedFile.name,
          })
          .select()
          .single()

        if (playlistError || !playlist) {
          throw new Error(playlistError?.message || "Failed to create playlist")
        }

        playlistIdToUse = playlist.id
      }

      const entriesToInsert = csvData
        .map((row) => mapRowToPlaylistEntry(row))
        .filter((entry) => entry.title || entry.artist) // Only include entries with at least a title or artist
        .map((entry) => ({
          playlist_id: playlistIdToUse,
          title: entry.title || null,
          artist: entry.artist || null,
          genre: entry.genre || null,
          year: entry.year || null,
          duration: entry.duration || null,
          bpm: entry.bpm || null,
          album: entry.album || null,
        }))

      console.log("Inserting entries (sample):", entriesToInsert.slice(0, 2)) // Log first 2 entries for debugging

      const { error: insertError } = await supabase.from("playlist_entries").insert(entriesToInsert)

      if (insertError) {
        console.error("Insert error details:", insertError)
        throw new Error(insertError.message)
      }

      // Update playlist song count
      await supabase.from("playlists").update({ song_count: entriesToInsert.length }).eq("id", playlistIdToUse)

      if (onPlaylistCreated) {
        onPlaylistCreated()
      }

      setSuccess(`Successfully uploaded ${entriesToInsert.length} entries!`)

      setTimeout(() => {
        setSelectedFile(null)
        setCsvData([])
        setCsvHeaders([])
        setShowPreview(false)
        setSelectedPlaylistId("new")
        setSuccess(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Data</h1>
        <p className="text-muted-foreground">Import your music data from external sources</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Playlist Data</CardTitle>
          <CardDescription>CSV or Excel files supported (max 10MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Playlist Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add to Playlist</label>
            <Select onValueChange={(val) => setSelectedPlaylistId(val)} defaultValue="new">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a playlist..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">➕ Create New Playlist</SelectItem>
                {playlists.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info Text */}
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-medium mb-2">📋 File Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Headers can include: Title, Artist, Genre, Year, Duration, BPM, Album</li>
              <li>Column names are flexible (e.g., "Song" works for "Title", "Category" works for "Genre")</li>
              <li>Numeric fields: Year, BPM</li>
              <li>Maximum file size: 10MB</li>
              <li>Supported formats: .csv, .xlsx, .xls files</li>
            </ul>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/5"
                : selectedFile
                  ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                  : "border-muted/30"
            }`}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
            }}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {csvData.length} rows
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null)
                    setCsvData([])
                    setCsvHeaders([])
                    setShowPreview(false)
                    setError(null)
                    setSuccess(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm">
                  Drop CSV or Excel file here or{" "}
                  <span
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary cursor-pointer hover:underline"
                  >
                    browse files
                  </span>
                </p>
              </div>
            )}
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0])
            }}
            className="hidden"
          />

          {showPreview && csvHeaders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Data Preview</h3>
                <span className="text-sm text-muted-foreground">(First 5 rows of {csvData.length} total)</span>
              </div>
              <div className="border rounded-md overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvHeaders.map((h, i) => (
                        <TableHead key={i}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {csvHeaders.map((h, j) => (
                          <TableCell key={j} className="max-w-[200px] truncate">
                            {row[h] || "-"}
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
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !csvData.length || isUploading}
              size="lg"
              className="min-w-40"
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Upload to Database
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Default export for backward compatibility
export default UploadDataContent
