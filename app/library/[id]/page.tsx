"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Music, AlertCircle, Calendar, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface PlaylistEntry {
  id: string
  title?: string
  artist?: string
  genre?: string
  year?: number
  duration?: string
  bpm?: number
  album?: string
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

        // Fetch playlist entries
        const { data: entriesData, error: entriesError } = await supabase
          .from("playlist_entries")
          .select("*")
          .eq("playlist_id", playlistId)
          .order("created_at", { ascending: true })

        if (entriesError) throw entriesError
        setEntries(entriesData || [])
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <p className="text-muted-foreground">
            {entries.length} entries • Created{" "}
            {new Date(playlist.created_at || playlist.date_created || "").toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Playlist Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Playlist Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Status:
              </span>
              <Badge className={getStatusColor(playlist.status)}>
                {playlist.status?.charAt(0).toUpperCase() + playlist.status?.slice(1) || "Unknown"}
              </Badge>
            </div>
            <div>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Source File:
              </span>
              <p className="text-muted-foreground">{playlist.source_file || "Unknown"}</p>
            </div>
            <div>
              <span className="font-medium">Total Entries:</span>
              <p className="text-muted-foreground">{entries.length}</p>
            </div>
          </div>
          {playlist.prompt && (
            <div className="mt-4">
              <span className="font-medium">AI Prompt:</span>
              <p className="text-muted-foreground text-sm mt-1 p-3 bg-muted rounded-lg">{playlist.prompt}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No entries found</h3>
              <p className="text-muted-foreground">This playlist doesn't have any entries yet.</p>
            </div>
          ) : (
            <div className="overflow-auto border rounded-md max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Album</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>BPM</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{entry.title || "-"}</TableCell>
                      <TableCell>{entry.artist || "-"}</TableCell>
                      <TableCell>
                        {entry.genre ? (
                          <Badge variant="secondary" className="text-xs">
                            {entry.genre}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{entry.album || "-"}</TableCell>
                      <TableCell>{entry.year || "-"}</TableCell>
                      <TableCell>{entry.duration || "-"}</TableCell>
                      <TableCell>{entry.bpm || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
