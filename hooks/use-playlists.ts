"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Playlist {
  id: string
  name: string
  description?: string
  song_count: number
  created_at: string
  updated_at: string
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false })

      if (supabaseError) {
        throw supabaseError
      }

      setPlaylists(data || [])
    } catch (err) {
      console.error("Error fetching playlists:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch playlists")
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert([
          {
            name,
            description,
            song_count: 0,
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      await fetchPlaylists()
      return data
    } catch (err) {
      console.error("Error creating playlist:", err)
      throw err
    }
  }

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    try {
      const { error } = await supabase.from("playlists").update(updates).eq("id", id)

      if (error) {
        throw error
      }

      await fetchPlaylists()
    } catch (err) {
      console.error("Error updating playlist:", err)
      throw err
    }
  }

  const deletePlaylist = async (id: string) => {
    try {
      // First delete all playlist entries
      const { error: entriesError } = await supabase.from("playlist_entries").delete().eq("playlist_id", id)

      if (entriesError) {
        throw entriesError
      }

      // Then delete the playlist
      const { error } = await supabase.from("playlists").delete().eq("id", id)

      if (error) {
        throw error
      }

      await fetchPlaylists()
    } catch (err) {
      console.error("Error deleting playlist:", err)
      throw err
    }
  }

  const deleteMultiplePlaylists = async (ids: string[]) => {
    try {
      // First delete all playlist entries for these playlists
      const { error: entriesError } = await supabase.from("playlist_entries").delete().in("playlist_id", ids)

      if (entriesError) {
        throw entriesError
      }

      // Then delete the playlists
      const { error } = await supabase.from("playlists").delete().in("id", ids)

      if (error) {
        throw error
      }

      await fetchPlaylists()
    } catch (err) {
      console.error("Error deleting playlists:", err)
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
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    deleteMultiplePlaylists,
  }
}
