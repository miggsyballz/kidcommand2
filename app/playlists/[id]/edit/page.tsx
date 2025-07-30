"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PlaylistEntriesEditor } from "@/components/playlist-entries-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlaylistUploadOverwrite } from "@/components/playlist-upload-overwrite"

interface Playlist {
  id: string
  name: string
  song_count: number
}

export default function EditPlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data, error } = await supabase
          .from("playlists")
          .select("id, name, song_count")
          .eq("id", playlistId)
          .single()

        if (error) throw error
        setPlaylist(data)
      } catch (err) {
        console.error("Error fetching playlist:", err)
      } finally {
        setLoading(false)
      }
    }

    if (playlistId) {
      fetchPlaylist()
    }
  }, [playlistId])

  const handleDataUploaded = () => {
    // Refresh playlist data after upload
    if (playlistId) {
      const fetchUpdatedPlaylist = async () => {
        try {
          const { data, error } = await supabase
            .from("playlists")
            .select("id, name, song_count")
            .eq("id", playlistId)
            .single()

          if (error) throw error
          setPlaylist(data)
        } catch (err) {
          console.error("Error fetching updated playlist:", err)
        }
      }
      fetchUpdatedPlaylist()
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
      </div>
    )
  }

  if (!playlist) {
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/playlists")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit: {playlist.name}</h1>
          <p className="text-muted-foreground">{playlist.song_count} entries • Edit inline or upload new data</p>
        </div>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Entries</TabsTrigger>
          <TabsTrigger value="upload">Upload & Replace</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inline Editor</CardTitle>
              <CardDescription>Click on any cell to edit playlist entries directly</CardDescription>
            </CardHeader>
            <CardContent>
              <PlaylistEntriesEditor selectedPlaylistId={playlistId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload & Replace Data
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file to completely replace all entries in this playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaylistUploadOverwrite playlistId={playlistId} onDataUploaded={handleDataUploaded} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
