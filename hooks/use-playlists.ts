"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface Playlist {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  song_count: number
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get all playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false })

      if (playlistsError) {
        throw playlistsError
      }

      // Then get song counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from("playlist_entries")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id)

          return {
            ...playlist,
            song_count: count || 0,
          }
        }),
      )

      setPlaylists(playlistsWithCounts)
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch playlists")
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase.from("playlists").insert([{ name, description }]).select().single()

      if (error) throw error

      // Add the new playlist with 0 song count
      const newPlaylist = { ...data, song_count: 0 }
      setPlaylists((prev) => [newPlaylist, ...prev])

      return newPlaylist
    } catch (err) {
      console.error("Error creating playlist:", err)
      throw err
    }
  }

  const deletePlaylist = async (id: string) => {
    try {
      // First delete all playlist entries
      await supabase.from("playlist_entries").delete().eq("playlist_id", id)

      // Then delete the playlist
      const { error } = await supabase.from("playlists").delete().eq("id", id)

      if (error) throw error

      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
    } catch (err) {
      console.error("Error deleting playlist:", err)
      throw err
    }
  }

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    try {
      const { data, error } = await supabase.from("playlists").update(updates).eq("id", id).select().single()

      if (error) throw error

      setPlaylists((prev) => prev.map((playlist) => (playlist.id === id ? { ...playlist, ...data } : playlist)))

      return data
    } catch (err) {
      console.error("Error updating playlist:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [])

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    refetch: fetchPlaylists,
  }
}
