"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Playlist {
  id: string
  name: string
  songCount: number
  dateCreated: string
  status: "active" | "draft" | "archived"
  prompt?: string
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test if table exists first
      const { data, error } = await supabase.from("playlists").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes('relation "public.playlists" does not exist')) {
          setError("Database table not found. Please run the setup scripts in your Supabase SQL Editor.")
        } else {
          console.error("Supabase error:", error)
          setError(`Database error: ${error.message}`)
        }
        return
      }

      // Transform the data to match our component interface
      const transformedData: Playlist[] =
        data?.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          songCount: playlist.song_count || 0,
          dateCreated: new Date(playlist.created_at || playlist.date_created).toLocaleDateString(),
          status: playlist.status || "draft",
          prompt: playlist.prompt,
        })) || []

      console.log("Fetched playlists:", transformedData)
      setPlaylists(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching playlists:", err)
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (name: string, status: "active" | "draft" | "archived" = "draft", prompt?: string) => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert([
          {
            name,
            status,
            prompt,
            song_count: 0,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Refresh the playlists
      await fetchPlaylists()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playlist")
      throw err
    }
  }

  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase.from("playlists").delete().eq("id", id)

      if (error) throw error

      // Refresh the playlists
      await fetchPlaylists()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete playlist")
      throw err
    }
  }

  const updatePlaylist = async (id: string, updates: Partial<Omit<Playlist, "id">>) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .update({
          name: updates.name,
          status: updates.status,
          song_count: updates.songCount,
          prompt: updates.prompt,
        })
        .eq("id", id)

      if (error) throw error

      // Refresh the playlists
      await fetchPlaylists()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update playlist")
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
