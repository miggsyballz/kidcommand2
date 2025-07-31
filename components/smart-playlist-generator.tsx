"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Sparkles, Music, Shuffle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface GeneratedTrack {
  id: string
  title: string
  artist: string
  genre: string
  energy?: number
  mood?: number
  tempo?: number
  duration: string
}

interface PlaylistCriteria {
  genre: string
  energyRange: [number, number]
  moodRange: [number, number]
  tempoRange: [number, number]
  maxTracks: number
  playlistName: string
}

export function SmartPlaylistGenerator() {
  const [criteria, setCriteria] = useState<PlaylistCriteria>({
    genre: "All Genres",
    energyRange: [1, 10],
    moodRange: [1, 10],
    tempoRange: [60, 180],
    maxTracks: 20,
    playlistName: "",
  })

  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  // Load available genres from database
  const loadGenres = async () => {
    try {
      const { data, error } = await supabase.from("playlist_entries").select("Catergory").not("Catergory", "is", null)

      if (error) throw error

      const genres = [...new Set(data?.map((item) => item.Catergory).filter(Boolean))] as string[]
      setAvailableGenres(genres.sort())
    } catch (error) {
      console.error("Error loading genres:", error)
    }
  }

  // Generate smart playlist based on criteria
  const generatePlaylist = async () => {
    if (!criteria.playlistName.trim()) {
      alert("Please enter a playlist name")
      return
    }

    setIsGenerating(true)
    try {
      let query = supabase
        .from("playlist_entries")
        .select("Title, Artist, Catergory, Energy, Mood, Tempo, Duration")
        .not("Title", "is", null)
        .not("Artist", "is", null)

      // Apply genre filter
      if (criteria.genre !== "All Genres") {
        query = query.eq("Catergory", criteria.genre)
      }

      // Apply energy filter
      if (criteria.energyRange[0] > 1 || criteria.energyRange[1] < 10) {
        query = query.gte("Energy", criteria.energyRange[0]).lte("Energy", criteria.energyRange[1])
      }

      // Apply mood filter
      if (criteria.moodRange[0] > 1 || criteria.moodRange[1] < 10) {
        query = query.gte("Mood", criteria.moodRange[0]).lte("Mood", criteria.moodRange[1])
      }

      // Apply tempo filter
      if (criteria.tempoRange[0] > 60 || criteria.tempoRange[1] < 180) {
        query = query.gte("Tempo", criteria.tempoRange[0]).lte("Tempo", criteria.tempoRange[1])
      }

      const { data, error } = await query.limit(criteria.maxTracks * 2) // Get more than needed for randomization

      if (error) throw error

      if (!data || data.length === 0) {
        alert("No tracks found matching your criteria. Try adjusting the filters.")
        return
      }

      // Randomize and limit results
      const shuffled = data.sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, criteria.maxTracks)

      const tracks: GeneratedTrack[] = selected.map((track, index) => ({
        id: `generated-${index}`,
        title: track.Title || "Unknown Title",
        artist: track.Artist || "Unknown Artist",
        genre: track.Catergory || "Unknown",
        energy: track.Energy,
        mood: track.Mood,
        tempo: track.Tempo,
        duration: track.Duration || "0:00",
      }))

      setGeneratedTracks(tracks)
    } catch (error) {
      console.error("Error generating playlist:", error)
      alert("Error generating playlist. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Save generated playlist to database
  const savePlaylist = async () => {
    if (generatedTracks.length === 0) {
      alert("No tracks to save")
      return
    }

    setIsSaving(true)
    try {
      // Create playlist
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .insert({
          name: criteria.playlistName,
          status: "active",
          song_count: generatedTracks.length,
          source_file: "Smart Generator",
        })
        .select()
        .single()

      if (playlistError) throw playlistError

      // Add tracks to playlist_entries
      const entries = generatedTracks.map((track) => ({
        playlist_id: playlist.id,
        Title: track.title,
        Artist: track.artist,
        Catergory: track.genre,
        Energy: track.energy,
        Mood: track.mood,
        Tempo: track.tempo,
        Duration: track.duration,
      }))

      const { error: entriesError } = await supabase.from("playlist_entries").insert(entries)

      if (entriesError) throw entriesError

      alert(`Playlist "${criteria.playlistName}" created successfully with ${generatedTracks.length} tracks!`)

      // Reset form
      setCriteria({
        ...criteria,
        playlistName: "",
      })
      setGeneratedTracks([])
    } catch (error) {
      console.error("Error saving playlist:", error)
      alert("Error saving playlist. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Load genres on component mount
  useEffect(() => {
    loadGenres()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Playlist Generator
          </CardTitle>
          <CardDescription>
            Generate intelligent playlists based on energy, mood, tempo, and genre preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Playlist Name */}
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              value={criteria.playlistName}
              onChange={(e) => setCriteria({ ...criteria, playlistName: e.target.value })}
              placeholder="Enter playlist name..."
            />
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <Label>Genre</Label>
            <Select value={criteria.genre} onValueChange={(value) => setCriteria({ ...criteria, genre: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Genres">All Genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Energy Range */}
          <div className="space-y-2">
            <Label>
              Energy Level: {criteria.energyRange[0]} - {criteria.energyRange[1]}
            </Label>
            <Slider
              value={criteria.energyRange}
              onValueChange={(value) => setCriteria({ ...criteria, energyRange: value as [number, number] })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Energy</span>
              <span>High Energy</span>
            </div>
          </div>

          {/* Mood Range */}
          <div className="space-y-2">
            <Label>
              Mood Range: {criteria.moodRange[0]} - {criteria.moodRange[1]}
            </Label>
            <Slider
              value={criteria.moodRange}
              onValueChange={(value) => setCriteria({ ...criteria, moodRange: value as [number, number] })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sad/Mellow</span>
              <span>Happy/Upbeat</span>
            </div>
          </div>

          {/* Tempo Range */}
          <div className="space-y-2">
            <Label>
              Tempo Range: {criteria.tempoRange[0]} - {criteria.tempoRange[1]} BPM
            </Label>
            <Slider
              value={criteria.tempoRange}
              onValueChange={(value) => setCriteria({ ...criteria, tempoRange: value as [number, number] })}
              min={60}
              max={180}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Max Tracks */}
          <div className="space-y-2">
            <Label>Maximum Tracks: {criteria.maxTracks}</Label>
            <Slider
              value={[criteria.maxTracks]}
              onValueChange={(value) => setCriteria({ ...criteria, maxTracks: value[0] })}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePlaylist}
            disabled={isGenerating || !criteria.playlistName.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Playlist...
              </>
            ) : (
              <>
                <Shuffle className="mr-2 h-4 w-4" />
                Generate Smart Playlist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Tracks */}
      {generatedTracks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Generated Playlist: {criteria.playlistName}
                </CardTitle>
                <CardDescription>{generatedTracks.length} tracks selected</CardDescription>
              </div>
              <Button onClick={savePlaylist} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Playlist"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Track</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Energy</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTracks.map((track, index) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell>{track.artist}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{track.genre}</Badge>
                      </TableCell>
                      <TableCell>{track.energy || "N/A"}</TableCell>
                      <TableCell>{track.mood || "N/A"}</TableCell>
                      <TableCell>{track.tempo ? `${track.tempo} BPM` : "N/A"}</TableCell>
                      <TableCell>{track.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
