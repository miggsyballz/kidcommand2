"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, X, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
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

interface CSVRow {
  [key: string]: string
}

interface PlaylistEntry {
  playlist_id?: string
  // Spreadsheet-style columns (matching the editor)
  Catergory?: string
  UID?: string
  Title?: string
  Artist?: string
  Keywords?: string
  Runs?: string
  Performnce?: number
  Era?: number
  Mood?: number
  Energy?: number
  Role?: string
  Sound?: string
  Tempo?: number
  Type?: string
  // Legacy columns for backward compatibility
  title?: string
  artist?: string
  genre?: string
  year?: number
  duration?: string
  bpm?: number
  album?: string
}

interface PlaylistUploadOverwriteProps {
  playlistId: string
  onDataUploaded?: () => void
}

export function PlaylistUploadOverwrite({ playlistId, onDataUploaded }: PlaylistUploadOverwriteProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mapRowToPlaylistEntry = (row: CSVRow): PlaylistEntry => {
    const entry: PlaylistEntry = {}

    // Enhanced column mappings to handle both spreadsheet-style and standard columns
    const columnMappings: { [key: string]: keyof PlaylistEntry } = {
      // Spreadsheet-style mappings (exact matches first)
      catergory: "Catergory",
      category: "Catergory",
      uid: "UID",
      title: "Title",
      artist: "Artist",
      keywords: "Keywords",
      runs: "Runs",
      performnce: "Performnce",
      performance: "Performnce",
      era: "Era",
      mood: "Mood",
      energy: "Energy",
      role: "Role",
      sound: "Sound",
      tempo: "Tempo",
      type: "Type",

      // Alternative mappings
      song: "Title",
      name: "Title",
      track: "Title",
      performer: "Artist",
      musician: "Artist",
      genre: "Catergory",
      style: "Catergory",
      year: "Era",
      decade: "Era",
      duration: "Runs",
      length: "Runs",
      time: "Runs",
      bpm: "Tempo",
      speed: "Tempo",
      album: "Keywords", // Map album to keywords as a fallback
      record: "Keywords",
      release: "Keywords",
    }

    // Process each column in the CSV row
    for (const key of Object.keys(row)) {
      const normalizedKey = key.toLowerCase().trim()
      const field = columnMappings[normalizedKey]

      if (field) {
        const value = row[key]?.trim()
        if (!value) continue

        // Handle numeric fields
        if (field === "Performnce" || field === "Era" || field === "Mood" || field === "Energy" || field === "Tempo") {
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

    // Also populate legacy columns for backward compatibility
    if (entry.Title) entry.title = entry.Title
    if (entry.Artist) entry.artist = entry.Artist
    if (entry.Catergory) entry.genre = entry.Catergory
    if (entry.Era) entry.year = entry.Era
    if (entry.Runs) entry.duration = entry.Runs
    if (entry.Tempo) entry.bpm = entry.Tempo

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

  const handleUploadAndReplace = async () => {
    if (!selectedFile || !csvData.length) {
      setError("No file or data loaded.")
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // First, delete all existing entries for this playlist
      const { error: deleteError } = await supabase.from("playlist_entries").delete().eq("playlist_id", playlistId)

      if (deleteError) {
        throw new Error(`Failed to clear existing entries: ${deleteError.message}`)
      }

      // Then, insert new entries with all mapped columns
      const entriesToInsert = csvData
        .map((row) => mapRowToPlaylistEntry(row))
        .filter((entry) => entry.Title || entry.Artist || entry.title || entry.artist) // Include entries with either format
        .map((entry) => ({
          playlist_id: playlistId,
          // Spreadsheet-style columns
          Catergory: entry.Catergory || null,
          UID: entry.UID || null,
          Title: entry.Title || null,
          Artist: entry.Artist || null,
          Keywords: entry.Keywords || null,
          Runs: entry.Runs || null,
          Performnce: entry.Performnce || null,
          Era: entry.Era || null,
          Mood: entry.Mood || null,
          Energy: entry.Energy || null,
          Role: entry.Role || null,
          Sound: entry.Sound || null,
          Tempo: entry.Tempo || null,
          Type: entry.Type || null,
          // Legacy columns for backward compatibility
          title: entry.title || entry.Title || null,
          artist: entry.artist || entry.Artist || null,
          genre: entry.genre || entry.Catergory || null,
          year: entry.year || entry.Era || null,
          duration: entry.duration || entry.Runs || null,
          bpm: entry.bpm || entry.Tempo || null,
          album: entry.album || null,
        }))

      console.log("Inserting entries (sample):", entriesToInsert.slice(0, 2)) // Log first 2 entries for debugging

      const { error: insertError } = await supabase.from("playlist_entries").insert(entriesToInsert)

      if (insertError) {
        console.error("Insert error details:", insertError)
        throw new Error(insertError.message)
      }

      // Update playlist song count
      await supabase.from("playlists").update({ song_count: entriesToInsert.length }).eq("id", playlistId)

      if (onDataUploaded) {
        onDataUploaded()
      }

      setSuccess(`Successfully replaced playlist with ${entriesToInsert.length} new entries!`)
      setConfirmDialogOpen(false)

      setTimeout(() => {
        setSelectedFile(null)
        setCsvData([])
        setCsvHeaders([])
        setShowPreview(false)
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

      {/* Warning Alert */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Warning:</strong> This will permanently delete all existing entries in this playlist and replace them
          with the uploaded data. This action cannot be undone.
        </AlertDescription>
      </Alert>

      {/* Info Text */}
      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="font-medium mb-2">📋 File Format Requirements:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            Headers can include: Catergory, UID, Title, Artist, Keywords, Runs, Performnce, Era, Mood, Energy, Role,
            Sound, Tempo, Type
          </li>
          <li>Alternative column names work: Song→Title, Genre→Catergory, BPM→Tempo, Duration→Runs, etc.</li>
          <li>Numeric fields: Performnce, Era, Mood, Energy, Tempo</li>
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
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={!selectedFile || !csvData.length || isUploading}
              size="lg"
              className="min-w-40"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Replace All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace All Playlist Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {csvData.length > 0 ? "existing" : ""} entries in this playlist and
                replace them with {csvData.length} new entries from your uploaded file. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUploadAndReplace}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isUploading}
              >
                {isUploading ? "Replacing..." : "Replace All Data"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
