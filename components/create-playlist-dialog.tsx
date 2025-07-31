"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { usePlaylists } from "../hooks/use-playlists"

interface CreatePlaylistDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreatePlaylist?: (name: string, description?: string) => Promise<any>
}

export function CreatePlaylistDialog({ open, onOpenChange, onCreatePlaylist }: CreatePlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { createPlaylist } = usePlaylists()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      if (onCreatePlaylist) {
        await onCreatePlaylist(name.trim(), description.trim() || undefined)
      } else {
        await createPlaylist(name.trim(), description.trim() || undefined)
      }

      setName("")
      setDescription("")
      onOpenChange?.(false)
    } catch (error) {
      console.error("Error creating playlist:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const content = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogDescription>Create a new playlist to organize your music collection.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name..."
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create Playlist"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {content}
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Playlist
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  )
}
