"use client"

import { useState, useEffect } from "react"
import PlaylistManagerContent from "../../components/playlist-manager-content" // Using lowercase version
import { usePlaylists } from "../../hooks/use-playlists"
import { Loader2, Database } from "lucide-react"
import { CreatePlaylistDialog } from "../../components/create-playlist-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlaylistsPage() {
  const [mounted, setMounted] = useState(false)
  const { playlists, loading, error, createPlaylist, deletePlaylist, refetch } = usePlaylists()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading playlists...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Database className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
            <CardDescription>The playlists table needs to be created in your Supabase database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Error:</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">To fix this:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>
                  Run the script from: <code>scripts/create-playlists-table.sql</code>
                </li>
                <li>
                  Optionally run: <code>scripts/insert-sample-data.sql</code> for sample data
                </li>
                <li>Click the retry button below</li>
              </ol>
            </div>
            <Button onClick={refetch} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlists</h1>
          <p className="text-muted-foreground">Manage your music playlists</p>
        </div>
        <CreatePlaylistDialog onCreatePlaylist={createPlaylist} />
      </div>

      <PlaylistManagerContent playlists={playlists} />
    </div>
  )
}
