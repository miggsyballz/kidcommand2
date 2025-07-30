"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Music, Eye, Edit, MoreHorizontal, Trash2, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
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

interface Playlist {
  id: string
  name: string
  song_count: number
  status: "active" | "draft" | "archived"
  date_created: string
  created_at: string
  prompt?: string
  actual_song_count?: number // We'll calculate this
}

interface PlaylistManagerContentProps {
  playlists?: Playlist[]
}

export function PlaylistManagerContent({ playlists: initialPlaylists }: PlaylistManagerContentProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists || [])
  const [loading, setLoading] = useState(!initialPlaylists)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!initialPlaylists) {
      fetchPlaylists()
    }
  }, [initialPlaylists])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch playlists with actual song counts
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false })

      if (playlistError) {
        throw playlistError
      }

      // Get actual song counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistData || []).map(async (playlist) => {
          const { count, error: countError } = await supabase
            .from("playlist_entries")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id)

          if (countError) {
            console.error("Error counting entries for playlist", playlist.id, countError)
          }

          return {
            ...playlist,
            actual_song_count: count || 0,
          }
        }),
      )

      // Update the database with correct counts
      for (const playlist of playlistsWithCounts) {
        if (playlist.song_count !== playlist.actual_song_count) {
          await supabase.from("playlists").update({ song_count: playlist.actual_song_count }).eq("id", playlist.id)
        }
      }

      setPlaylists(playlistsWithCounts as Playlist[])
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const refreshCounts = async () => {
    setRefreshing(true)
    await fetchPlaylists()
    setRefreshing(false)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Unknown"

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (err) {
      return "Unknown"
    }
  }

  const handleViewPlaylist = (playlistId: string) => {
    router.push(`/library/${playlistId}`)
  }

  const handleEditPlaylist = (playlistId: string) => {
    // Navigate to the entries editor for this specific playlist
    router.push(`/playlists/${playlistId}/edit`)
  }

  const handlePlaylistNameClick = (playlistId: string) => {
    // Make playlist name clickable to open editor
    handleEditPlaylist(playlistId)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlaylists(new Set(playlists.map((p) => p.id)))
    } else {
      setSelectedPlaylists(new Set())
    }
  }

  const handleSelectPlaylist = (playlistId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlaylists)
    if (checked) {
      newSelected.add(playlistId)
    } else {
      newSelected.delete(playlistId)
    }
    setSelectedPlaylists(newSelected)
  }

  const handleDeleteSingle = async (playlistId: string) => {
    setIsDeleting(true)
    try {
      // Delete playlist entries first
      const { error: entriesError } = await supabase.from("playlist_entries").delete().eq("playlist_id", playlistId)

      if (entriesError) {
        console.error("Error deleting playlist entries:", entriesError)
      }

      // Then delete the playlist
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId)

      if (error) throw error

      // Refresh playlists
      await fetchPlaylists()
      setPlaylistToDelete(null)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error("Error deleting playlist:", err)
      setError(err instanceof Error ? err.message : "Failed to delete playlist")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedPlaylists.size === 0) return

    setIsDeleting(true)
    try {
      // Delete playlist entries first
      const { error: entriesError } = await supabase
        .from("playlist_entries")
        .delete()
        .in("playlist_id", Array.from(selectedPlaylists))

      if (entriesError) {
        console.error("Error deleting playlist entries:", entriesError)
      }

      // Then delete the playlists
      const { error } = await supabase.from("playlists").delete().in("id", Array.from(selectedPlaylists))

      if (error) throw error

      // Refresh playlists and clear selection
      await fetchPlaylists()
      setSelectedPlaylists(new Set())
    } catch (err) {
      console.error("Error deleting playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to delete playlists")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playlist Manager</CardTitle>
          <CardDescription>Loading playlists...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playlist Manager</CardTitle>
          <CardDescription>Error loading playlists</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchPlaylists} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Playlist Manager
            </CardTitle>
            <CardDescription>
              Manage your playlists ({playlists.length} total) • Click playlist names to edit
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshCounts} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            {selectedPlaylists.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedPlaylists.size} selected</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedPlaylists.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Playlists</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedPlaylists.size} playlist
                        {selectedPlaylists.size > 1 ? "s" : ""}? This action cannot be undone and will also delete all
                        associated entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteMultiple}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
            <p className="text-muted-foreground">Create your first playlist to get started</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPlaylists.size === playlists.length && playlists.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all playlists"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Songs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((playlist) => (
                  <TableRow key={playlist.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedPlaylists.has(playlist.id)}
                        onCheckedChange={(checked) => handleSelectPlaylist(playlist.id, checked as boolean)}
                        aria-label={`Select ${playlist.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <button
                          onClick={() => handlePlaylistNameClick(playlist.id)}
                          className="font-medium text-left hover:text-primary hover:underline transition-colors cursor-pointer focus:outline-none focus:text-primary focus:underline"
                          title="Click to edit playlist entries"
                        >
                          {playlist.name}
                        </button>
                        {playlist.prompt && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px] mt-1">{playlist.prompt}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {playlist.actual_song_count !== undefined
                          ? playlist.actual_song_count
                          : playlist.song_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(playlist.status)}>{playlist.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(playlist.created_at || playlist.date_created)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPlaylist(playlist.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPlaylist(playlist.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Entries
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPlaylistToDelete(playlist.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playlist? This action cannot be undone and will also delete all
              associated entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playlistToDelete && handleDeleteSingle(playlistToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// Default export for backward compatibility
export default PlaylistManagerContent
