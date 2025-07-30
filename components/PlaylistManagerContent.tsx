"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Music, Eye, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { useRouter } from "next/navigation"

interface Playlist {
  id: string
  name: string
  song_count: number
  status: "active" | "draft" | "archived"
  date_created: string
  created_at: string
  prompt?: string
}

interface PlaylistManagerContentProps {
  playlists?: Playlist[]
}

export default function PlaylistManagerContent({ playlists: initialPlaylists }: PlaylistManagerContentProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists || [])
  const [loading, setLoading] = useState(!initialPlaylists)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!initialPlaylists) {
      fetchPlaylists()
    }
  }, [initialPlaylists])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("playlists").select("*").order("date_created", { ascending: false })

      if (error) {
        throw error
      }

      setPlaylists((data as Playlist[]) || [])
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to load playlists")
    } finally {
      setLoading(false)
    }
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

  const handleViewPlaylist = (playlistId: string) => {
    router.push(`/library/${playlistId}`)
  }

  const handleEditPlaylist = (playlistId: string) => {
    router.push(`/library/${playlistId}`)
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      setIsDeleting(true)
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId)

      if (error) {
        throw error
      }

      setPlaylists((prevPlaylists) => prevPlaylists.filter((playlist) => playlist.id !== playlistId))
    } catch (err) {
      console.error("Error deleting playlist:", err)
      setError(err instanceof Error ? err.message : "Failed to delete playlist")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPlaylists.size === 0) return

    try {
      setIsDeleting(true)
      const { error } = await supabase.from("playlists").delete().in("id", Array.from(selectedPlaylists))

      if (error) {
        throw error
      }

      setPlaylists((prevPlaylists) => prevPlaylists.filter((playlist) => !selectedPlaylists.has(playlist.id)))
      setSelectedPlaylists(new Set())
    } catch (err) {
      console.error("Error deleting playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to delete playlists")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCheckboxChange = (playlistId: string) => {
    setSelectedPlaylists((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(playlistId)) {
        newSelected.delete(playlistId)
      } else {
        newSelected.add(playlistId)
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    setSelectedPlaylists(new Set(playlists.map((playlist) => playlist.id)))
  }

  const handleDeselectAll = () => {
    setSelectedPlaylists(new Set())
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
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Playlist Manager
        </CardTitle>
        <CardDescription>Manage your playlists ({playlists.length} total)</CardDescription>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPlaylists.size === playlists.length}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                <Button onClick={handleDeselectAll} variant="outline" size="sm">
                  Deselect All
                </Button>
              </div>
              {selectedPlaylists.size > 0 && (
                <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" size="sm">
                  Delete Selected
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={selectedPlaylists.size === playlists.length} onCheckedChange={handleSelectAll} />
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
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selectedPlaylists.has(playlist.id)}
                        onCheckedChange={() => handleCheckboxChange(playlist.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">{playlist.name}</p>
                        {playlist.prompt && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{playlist.prompt}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{playlist.song_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(playlist.status)}>{playlist.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(playlist.date_created || playlist.created_at).toLocaleDateString()}
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
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPlaylist(playlist.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPlaylistToDelete(playlist.id)}>
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your playlist and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeletePlaylist(playlistToDelete || "")}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
