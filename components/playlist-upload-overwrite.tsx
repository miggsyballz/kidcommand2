"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ParsedData {
  headers: string[]
  rows: any[]
  fileName: string
}

interface Playlist {
  id: string
  name: string
  song_count: number
}

// Helper function to convert Excel time fractions to seconds
function convertExcelTimeToSeconds(value: any): number {
  if (typeof value === "number" && value < 1 && value > 0) {
    // Excel time fraction (e.g., 0.04166 = 1 minute)
    return Math.round(value * 24 * 60 * 60)
  }

  if (typeof value === "string") {
    // Handle mm:ss format
    const timeMatch = value.match(/^(\d+):(\d+)$/)
    if (timeMatch) {
      const minutes = Number.parseInt(timeMatch[1])
      const seconds = Number.parseInt(timeMatch[2])
      return minutes * 60 + seconds
    }

    // Handle plain number as string
    const num = Number.parseFloat(value)
    if (!isNaN(num)) {
      return num < 1 && num > 0 ? Math.round(num * 24 * 60 * 60) : num
    }
  }

  return typeof value === "number" ? value : 0
}

// Helper function to format seconds as mm:ss for display
function formatSecondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Process row data to handle time columns
function processRowData(row: any, headers: string[]): any {
  const processedRow = { ...row }

  headers.forEach((header) => {
    const value = row[header]

    // Check if this looks like a time/duration column
    const isTimeColumn =
      header.toLowerCase().includes("runtime") ||
      header.toLowerCase().includes("duration") ||
      header.toLowerCase().includes("time") ||
      header.toLowerCase().includes("runs")

    if (isTimeColumn && value !== undefined && value !== null && value !== "") {
      const seconds = convertExcelTimeToSeconds(value)
      processedRow[header] = seconds
    }
  })

  return processedRow
}

export function PlaylistUploadOverwrite() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  const fetchPlaylists = async () => {
    try {
      setLoadingPlaylists(true)
      const { data, error } = await supabase.from("playlists").select("id, name, song_count").order("name")

      if (error) throw error

      setPlaylists(data || [])
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError("Failed to load playlists")
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setSuccess(null)
    setParsedData(null)

    // Load playlists when file is selected
    fetchPlaylists()
  }

  const parseFile = async () => {
    if (!file) return

    try {
      setError(null)

      let data: any[][]
      let headers: string[]

      if (file.name.toLowerCase().endsWith(".csv")) {
        // Parse CSV
        const text = await file.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length === 0) {
          throw new Error("CSV file is empty")
        }

        // Parse CSV manually to handle quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ""
          let inQuotes = false

          for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              result.push(current.trim())
              current = ""
            } else {
              current += char
            }
          }

          result.push(current.trim())
          return result
        }

        headers = parseCSVLine(lines[0])
        data = lines.slice(1).map((line) => parseCSVLine(line))
      } else {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to array of arrays
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (rawData.length === 0) {
          throw new Error("Excel file is empty")
        }

        headers = rawData[0].map((h) => String(h || "").trim()).filter((h) => h)
        data = rawData.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== ""))
      }

      // Convert array data to objects
      const rows = data
        .map((row) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            const value = row[index]
            obj[header] = value !== undefined && value !== null ? String(value).trim() : ""
          })
          return obj
        })
        .filter((row) => Object.values(row).some((val) => val !== ""))

      setParsedData({
        headers,
        rows,
        fileName: file.name,
      })
    } catch (err) {
      console.error("Parse error:", err)
      setError(err instanceof Error ? err.message : "Failed to parse file")
    }
  }

  const handleUpload = async () => {
    if (!parsedData || !selectedPlaylist) {
      setError("Please select a playlist and parse the file first")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setError(null)

      // Delete existing songs from the playlist
      const { error: deleteError } = await supabase
        .from("playlist_entries")
        .delete()
        .eq("playlist_id", selectedPlaylist)

      if (deleteError) {
        throw new Error(`Failed to clear existing songs: ${deleteError.message}`)
      }

      setUploadProgress(25)

      // Process and insert new songs
      const songsToInsert = parsedData.rows.map((row) => {
        const processedRow = processRowData(row, parsedData.headers)

        return {
          playlist_id: selectedPlaylist,
          source_file: parsedData.fileName,
          data: processedRow, // ✅ Insert as object, NOT JSON string
        }
      })

      setUploadProgress(50)

      // Insert all songs
      const { error: songsError } = await supabase.from("playlist_entries").insert(songsToInsert)

      if (songsError) {
        throw new Error(`Song upload failed: ${songsError.message}`)
      }

      setUploadProgress(75)

      // Update playlist info
      const { error: updateError } = await supabase
        .from("playlists")
        .update({
          song_count: songsToInsert.length,
          column_structure: JSON.stringify(parsedData.headers),
        })
        .eq("id", selectedPlaylist)

      if (updateError) {
        console.warn("Failed to update playlist info:", updateError.message)
      }

      setUploadProgress(100)

      const playlistName = playlists.find((p) => p.id === selectedPlaylist)?.name || "Selected playlist"
      setSuccess(`Successfully replaced ${songsToInsert.length} songs in "${playlistName}"`)

      // Reset form
      setFile(null)
      setParsedData(null)
      setSelectedPlaylist("")

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Refresh playlists
      await fetchPlaylists()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Replace Playlist Data</h1>
        <p className="text-muted-foreground">
          Upload a new file to completely replace the contents of an existing playlist.
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Select File</CardTitle>
          <CardDescription>Choose a CSV or Excel file to replace playlist data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            <Button onClick={parseFile} disabled={!file || uploading}>
              <FileText className="h-4 w-4 mr-2" />
              Parse File
            </Button>
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{file.name}</span>
              <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlist Selection */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Select Playlist to Replace</CardTitle>
            <CardDescription>Choose which playlist to overwrite with the new data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="playlist-select">Target Playlist</Label>
                  <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playlist to replace..." />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name} ({playlist.song_count} songs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchPlaylists}
                  disabled={loadingPlaylists}
                  className="mt-6 bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPlaylists ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {selectedPlaylist && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This will permanently delete all existing songs in the selected playlist
                    and replace them with the {parsedData.rows.length} songs from your uploaded file.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Found {parsedData.rows.length} songs with {parsedData.headers.length} columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {parsedData.headers.map((header) => (
                  <Badge key={header} variant="secondary">
                    {header}
                  </Badge>
                ))}
              </div>

              <div className="overflow-auto max-h-96 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsedData.headers.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {parsedData.headers.map((header) => {
                          const value = row[header]

                          // Check if this looks like a time column and format for display
                          const isTimeColumn =
                            header.toLowerCase().includes("runtime") ||
                            header.toLowerCase().includes("duration") ||
                            header.toLowerCase().includes("time") ||
                            header.toLowerCase().includes("runs")

                          let displayValue = value

                          if (isTimeColumn && value) {
                            const seconds = convertExcelTimeToSeconds(value)
                            if (seconds > 0) {
                              displayValue = formatSecondsToMinutes(seconds)
                            }
                          }

                          return (
                            <TableCell key={header} className="whitespace-nowrap">
                              {displayValue || "-"}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedData.rows.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  Showing first 10 rows of {parsedData.rows.length} total rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {parsedData && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedPlaylist}
                className="w-full"
                size="lg"
                variant="destructive"
              >
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Replacing... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Replace with {parsedData.rows.length} Songs
                  </>
                )}
              </Button>

              {uploading && <Progress value={uploadProgress} className="w-full" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default PlaylistUploadOverwrite
