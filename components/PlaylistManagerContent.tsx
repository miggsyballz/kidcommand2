"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Plus, Search, Trash2, Edit, Calendar, MoreVertical, Play } from "lucide-react"
import { usePlaylists } from "@/hooks/use-playlists"
import { CreatePlaylistDialog } from "./create-playlist-dialog"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function PlaylistManagerContent() {
  const { playlists, loading, error, deletePlaylist } = usePlaylists()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (playlist.description && playlist.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleSelectPlaylist = (playlistId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlaylists([...selectedPlaylists, playlistId])
    } else {
      setSelectedPlaylists(selectedPlaylists.filter((id) => id !== playlistId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlaylists(filteredPlaylists.map((p) => p.id))
    } else {
      setSelectedPlaylists([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPlaylists.length === 0) return

    setIsDeleting(true)
    try {
      await Promise.all(selectedPlaylists.map((id) => deletePlaylist(id)))
      setSelectedPlaylists([])
    } catch (err) {
      console.error("Error deleting playlists:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error fetching playlists: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playlist Manager</h1>
          <p className="text-muted-foreground">Manage your music playlists and organize your content</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Playlist
        </Button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedPlaylists.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedPlaylists.length} selected</span>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Selected"}
            </Button>
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No playlists match your search." : "Get started by creating your first playlist."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Playlist
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedPlaylists.length === filteredPlaylists.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all ({filteredPlaylists.length})
            </label>
          </div>

          {/* Playlists List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPlaylists.includes(playlist.id)}
                        onCheckedChange={(checked) => handleSelectPlaylist(playlist.id, checked as boolean)}
                      />
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                        <Music className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/playlists/${playlist.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/library/${playlist.id}`}>
                            <Play className="mr-2 h-4 w-4" />
                            View Songs
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deletePlaylist(playlist.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                    {playlist.description && <CardDescription className="mt-1">{playlist.description}</CardDescription>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        <span>{playlist.song_count} songs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(playlist.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/playlists/${playlist.id}/edit`}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/library/${playlist.id}`}>
                        <Play className="mr-2 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
