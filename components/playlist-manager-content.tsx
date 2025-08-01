"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Music, Search, Plus, MoreHorizontal, Eye, Edit, Trash2, AlertCircle, GripVertical } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { usePlaylists } from "@/hooks/use-playlists"
import { CreatePlaylistDialog } from "./create-playlist-dialog"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable, SortableContext } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface PlaylistWithPosition {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  song_count: number
  status: "active" | "draft" | "archived"
  source_file?: string
  position: number
}

// Sortable Playlist Row Component
function SortablePlaylistRow({
  playlist,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: {
  playlist: PlaylistWithPosition
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: playlist.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={`border-b hover:bg-muted/50 ${isDragging ? "bg-muted" : ""}`}>
      <td className="py-2 px-3 w-12">
        <div className="flex items-center gap-2">
          <button className="cursor-grab hover:bg-muted rounded p-1" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(playlist.id, checked as boolean)} />
        </div>
      </td>
      <td className="py-2 px-3">
        <div className="flex flex-col">
          <span className="font-medium text-sm">{playlist.name}</span>
          {playlist.description && <span className="text-xs text-muted-foreground">{playlist.description}</span>}
        </div>
      </td>
      <td className="py-2 px-3 text-center">
        <Badge variant="secondary" className="text-xs">
          {playlist.song_count}
        </Badge>
      </td>
      <td className="py-2 px-3">
        <Badge
          variant={playlist.status === "active" ? "default" : playlist.status === "draft" ? "secondary" : "outline"}
          className="text-xs"
        >
          {playlist.status}
        </Badge>
      </td>
      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(playlist.created_at).toLocaleDateString()}</td>
      <td className="py-2 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(playlist.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(playlist.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(playlist.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

export function PlaylistManagerContent() {
  const router = useRouter()
  const { playlists, loading, error, deletePlaylist, refetch } = usePlaylists()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null)
  const [playlistsWithPosition, setPlaylistsWithPosition] = useState<PlaylistWithPosition[]>([])
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    // Convert playlists to include position and sort by position
    const playlistsWithPos = playlists.map((playlist, index) => ({
      ...playlist,
      position: index + 1,
      status: "active" as const,
    }))
    setPlaylistsWithPosition(playlistsWithPos)
  }, [playlists])

  const filteredPlaylists = playlistsWithPosition.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectPlaylist = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedPlaylists)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedPlaylists(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlaylists(new Set(filteredPlaylists.map((p) => p.id)))
    } else {
      setSelectedPlaylists(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPlaylists.size === 0) return

    try {
      await Promise.all(Array.from(selectedPlaylists).map((id) => deletePlaylist(id)))
      setSelectedPlaylists(new Set())
      await refetch()
    } catch (err) {
      console.error("Error deleting playlists:", err)
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    setPlaylistToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!playlistToDelete) return

    try {
      await deletePlaylist(playlistToDelete)
      await refetch()
    } catch (err) {
      console.error("Error deleting playlist:", err)
    } finally {
      setDeleteDialogOpen(false)
      setPlaylistToDelete(null)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const oldIndex = playlistsWithPosition.findIndex((playlist) => playlist.id === active.id)
    const newIndex = playlistsWithPosition.findIndex((playlist) => playlist.id === over.id)

    if (oldIndex !== newIndex) {
      const newPlaylists = arrayMove(playlistsWithPosition, oldIndex, newIndex).map((playlist, index) => ({
        ...playlist,
        position: index + 1,
      }))

      setPlaylistsWithPosition(newPlaylists)

      // Update positions in database
      try {
        const updates = newPlaylists.map((playlist) => ({
          id: playlist.id,
          position: playlist.position,
        }))

        const { error } = await supabase.from("playlists").upsert(updates, { onConflict: "id" })

        if (error) throw error
      } catch (err) {
        console.error("Error updating playlist positions:", err)
      }
    }

    setActiveId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading playlists...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Playlists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refetch} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Music className="h-8 w-8" />
              Playlist Manager
            </h1>
            <p className="text-muted-foreground">{filteredPlaylists.length} playlists</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Playlist
            </Button>
          </div>
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
          {selectedPlaylists.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedPlaylists.size} selected</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Playlists Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Playlists ({filteredPlaylists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPlaylists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No playlists found.</p>
                <p className="text-sm">Create your first playlist to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 w-12">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Checkbox
                            checked={
                              selectedPlaylists.size === filteredPlaylists.length && filteredPlaylists.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th className="text-left py-2 px-3 font-medium">Name</th>
                      <th className="text-center py-2 px-3 font-medium">Songs</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                      <th className="text-left py-2 px-3 font-medium">Created</th>
                      <th className="text-left py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext items={filteredPlaylists.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                      {filteredPlaylists.map((playlist) => (
                        <SortablePlaylistRow
                          key={playlist.id}
                          playlist={playlist}
                          isSelected={selectedPlaylists.has(playlist.id)}
                          onSelect={handleSelectPlaylist}
                          onView={(id) => router.push(`/library/${id}`)}
                          onEdit={(id) => router.push(`/playlists/${id}/edit`)}
                          onDelete={handleDeletePlaylist}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-background border rounded shadow-lg p-2 opacity-90">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span className="text-sm font-medium">{filteredPlaylists.find((p) => p.id === activeId)?.name}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Create Playlist Dialog */}
        <CreatePlaylistDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={refetch} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the playlist and all its entries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  )
}
