"use client"

import { useState, useRef } from "react"
import { Upload, CheckCircle2, AlertCircle, Database, Plus, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import * as XLSX from "xlsx"

interface LibraryUploadContentProps {
  onDataUploaded?: () => void
}

export function LibraryUploadContent({ onDataUploaded }: LibraryUploadContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("new")
  const [deduplicateMode, setDeduplicateMode] = useState<"skip" | "create">("skip")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const isCSV = file.name.endsWith(".csv")
    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
    if (!isCSV && !isXLSX) return setError("Only CSV or Excel files are supported.")
    setSelectedFile(file)
    setError(null)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" })
      const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[]
      setHeaders(headerRow)
      setCsvData(json as any[])
    } catch (e) {
      setError("Failed to parse file.")
    }
  }

  const fetchPlaylists = async () => {
    const { data, error } = await supabase.from("playlists").select("id, name").order("created_at", { ascending: false })
    if (!error && data) setPlaylists(data)
  }

  useState(() => {
    fetchPlaylists()
  })

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
    if (!selectedFile || !csvData.length) return setError("No file or data loaded.")

    setIsUploading(true)
    setError(null)
    setSuccess(null)

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
          })
          .select()
          .single()
        if (error || !playlist) throw new Error(error?.message || "Could not create playlist")
        playlistId = playlist.id
      }

      let entries = csvData.map((row) => ({
        playlist_id: playlistId,
        source_file: selectedFile.name,
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

      if (onDataUploaded) onDataUploaded()
      setSuccess(`Uploaded ${entries.length} songs successfully.`)

      setTimeout(() => {
        setSelectedFile(null)
        setCsvData([])
        setHeaders([])
        fileInputRef.current?.value && (fileInputRef.current.value = "")
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Music Data
        </CardTitle>
        <CardDescription>
          Upload a spreadsheet to create or update a playlist. Accepts `.csv`, `.xlsx`, or `.xls` files.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
                    <Plus className="h-4 w-4" />
                    Create New Playlist
                  </div>
                </SelectItem>
                {playlists.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
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
                  setError(null)
                  setSuccess(null)
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
          <Button onClick={handleUpload} disabled={isUploading || !csvData.length} size="lg" className="min-w-40">
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Upload to Library
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
