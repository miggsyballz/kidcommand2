"use client"

import { useState } from "react"
import { Sparkles, Target, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"

interface PlaylistCriteria {
  name: string
  description: string
  targetLength: number
  moodRange: [number, number]
  energyRange: [number, number]
  eraRange: [number, number]
  tempoRange: [number, number]
  categories: string[]
  keywords: string[]
  excludeKeywords: string[]
}

interface GeneratedTrack {
  id: string
  title: string
  artist: string
  category: string
  mood: number
  energy: number
  era: number
  tempo: number
  matchScore: number
}

export function SmartPlaylistGenerator() {
  const [criteria, setCriteria] = useState<PlaylistCriteria>({
    name: "",
    description: "",
    targetLength: 20,
    moodRange: [1, 10],
    energyRange: [1, 10],
    eraRange: [1980, 2024],
    tempoRange: [60, 180],
    categories: [],
    keywords: [],
    excludeKeywords: [],
  })

  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("")

  // Fetch available categories on mount
  useState(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("playlist_entries").select("Catergory").not("Catergory", "is", null)

      if (data) {
        const unique = [...new Set(data.map((d) => d.Catergory).filter(Boolean))]
        setAvailableCategories(unique)
      }
    }
    fetchCategories()
  })

  const calculateMatchScore = (track: any, criteria: PlaylistCriteria): number => {
    let score = 0
    let factors = 0

    // Mood match (0-40 points)
    if (track.Mood >= criteria.moodRange[0] && track.Mood <= criteria.moodRange[1]) {
      score += 40
    } else {
      const distance = Math.min(
        Math.abs(track.Mood - criteria.moodRange[0]),
        Math.abs(track.Mood - criteria.moodRange[1]),
      )
      score += Math.max(0, 40 - distance * 5)
    }
    factors++

    // Energy match (0-30 points)
    if (track.Energy >= criteria.energyRange[0] && track.Energy <= criteria.energyRange[1]) {
      score += 30
    } else {
      const distance = Math.min(
        Math.abs(track.Energy - criteria.energyRange[0]),
        Math.abs(track.Energy - criteria.energyRange[1]),
      )
      score += Math.max(0, 30 - distance * 4)
    }
    factors++

    // Era match (0-15 points)
    if (track.Era >= criteria.eraRange[0] && track.Era <= criteria.eraRange[1]) {
      score += 15
    }
    factors++

    // Tempo match (0-15 points)
    if (track.Tempo >= criteria.tempoRange[0] && track.Tempo <= criteria.tempoRange[1]) {
      score += 15
    }
    factors++

    // Category match (bonus points)
    if (criteria.categories.length === 0 || criteria.categories.includes(track.Catergory)) {
      score += 20
    }

    // Keyword match (bonus points)
    if (criteria.keywords.length > 0) {
      const trackKeywords = (track.Keywords || "").toLowerCase()
      const matchingKeywords = criteria.keywords.filter((keyword) => trackKeywords.includes(keyword.toLowerCase()))
      score += matchingKeywords.length * 10
    }

    // Exclude keywords (penalty)
    if (criteria.excludeKeywords.length > 0) {
      const trackKeywords = (track.Keywords || "").toLowerCase()
      const excludedKeywords = criteria.excludeKeywords.filter((keyword) =>
        trackKeywords.includes(keyword.toLowerCase()),
      )
      score -= excludedKeywords.length * 20
    }

    return Math.max(0, Math.min(100, score))
  }

  const generatePlaylist = async () => {
    setIsGenerating(true)

    try {
      // Fetch all entries from library
      const { data: allTracks, error } = await supabase
        .from("playlist_entries")
        .select("*")
        .not("Title", "is", null)
        .not("Artist", "is", null)

      if (error) throw error

      // Calculate match scores for all tracks
      const scoredTracks = allTracks
        .map((track) => ({
          id: track.id,
          title: track.Title || track.title,
          artist: track.Artist || track.artist,
          category: track.Catergory || track.genre || "Unknown",
          mood: track.Mood || 5,
          energy: track.Energy || 5,
          era: track.Era || track.year || 2020,
          tempo: track.Tempo || track.bpm || 120,
          matchScore: calculateMatchScore(track, criteria),
        }))
        .filter((track) => track.matchScore > 30) // Only include decent matches
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score
        .slice(0, criteria.targetLength) // Limit to target length

      setGeneratedTracks(scoredTracks)
    } catch (err) {
      console.error("Failed to generate playlist:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const savePlaylist = async () => {
    if (!criteria.name || generatedTracks.length === 0) return

    try {
      // Create new playlist
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .insert({
          name: criteria.name,
          status: "active",
          prompt: criteria.description,
          song_count: generatedTracks.length,
        })
        .select()
        .single()

      if (playlistError) throw playlistError

      // Add tracks to playlist (create copies)
      const playlistEntries = generatedTracks.map((track) => ({
        playlist_id: playlist.id,
        Title: track.title,
        Artist: track.artist,
        Catergory: track.category,
        Mood: track.mood,
        Energy: track.energy,
        Era: track.era,
        Tempo: track.tempo,
      }))

      const { error: entriesError } = await supabase.from("playlist_entries").insert(playlistEntries)

      if (entriesError) throw entriesError

      alert(`Playlist "${criteria.name}" created successfully with ${generatedTracks.length} tracks!`)

      // Reset form
      setCriteria({
        name: "",
        description: "",
        targetLength: 20,
        moodRange: [1, 10],
        energyRange: [1, 10],
        eraRange: [1980, 2024],
        tempoRange: [60, 180],
        categories: [],
        keywords: [],
        excludeKeywords: [],
      })
      setGeneratedTracks([])
    } catch (err) {
      console.error("Failed to save playlist:", err)
      alert("Failed to save playlist. Please try again.")
    }
  }

  const addKeyword = (type: "include" | "exclude") => {
    const input = type === "include" ? keywordInput : excludeKeywordInput
    if (!input.trim()) return

    if (type === "include") {
      setCriteria((prev) => ({
        ...prev,
        keywords: [...prev.keywords, input.trim()],
      }))
      setKeywordInput("")
    } else {
      setCriteria((prev) => ({
        ...prev,
        excludeKeywords: [...prev.excludeKeywords, input.trim()],
      }))
      setExcludeKeywordInput("")
    }
  }

  const removeKeyword = (keyword: string, type: "include" | "exclude") => {
    if (type === "include") {
      setCriteria((prev) => ({
        ...prev,
        keywords: prev.keywords.filter((k) => k !== keyword),
      }))
    } else {
      setCriteria((prev) => ({
        ...prev,
        excludeKeywords: prev.excludeKeywords.filter((k) => k !== keyword),
      }))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Playlist Generator
          </CardTitle>
          <CardDescription>Create intelligent playlists based on mood, energy, era, and other criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Smart Playlist"
                value={criteria.name}
                onChange={(e) => setCriteria((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-length">Target Length</Label>
              <Input
                id="target-length"
                type="number"
                min="5"
                max="100"
                value={criteria.targetLength}
                onChange={(e) =>
                  setCriteria((prev) => ({ ...prev, targetLength: Number.parseInt(e.target.value) || 20 }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the vibe and purpose of this playlist..."
              value={criteria.description}
              onChange={(e) => setCriteria((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Mood & Energy Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>
                Mood Range: {criteria.moodRange[0]} - {criteria.moodRange[1]}
              </Label>
              <Slider
                value={criteria.moodRange}
                onValueChange={(value) => setCriteria((prev) => ({ ...prev, moodRange: value as [number, number] }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sad</span>
                <span>Happy</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>
                Energy Range: {criteria.energyRange[0]} - {criteria.energyRange[1]}
              </Label>
              <Slider
                value={criteria.energyRange}
                onValueChange={(value) => setCriteria((prev) => ({ ...prev, energyRange: value as [number, number] }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Calm</span>
                <span>Energetic</span>
              </div>
            </div>
          </div>

          {/* Era & Tempo Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>
                Era Range: {criteria.eraRange[0]} - {criteria.eraRange[1]}
              </Label>
              <Slider
                value={criteria.eraRange}
                onValueChange={(value) => setCriteria((prev) => ({ ...prev, eraRange: value as [number, number] }))}
                min={1950}
                max={2024}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label>
                Tempo Range: {criteria.tempoRange[0]} - {criteria.tempoRange[1]} BPM
              </Label>
              <Slider
                value={criteria.tempoRange}
                onValueChange={(value) => setCriteria((prev) => ({ ...prev, tempoRange: value as [number, number] }))}
                min={60}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label>Categories (leave empty for all)</Label>
            <Select
              onValueChange={(value) => {
                if (!criteria.categories.includes(value)) {
                  setCriteria((prev) => ({ ...prev, categories: [...prev.categories, value] }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add category..." />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {criteria.categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setCriteria((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== category) }))
                  }}
                >
                  {category} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Include Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addKeyword("include")}
                />
                <Button size="sm" onClick={() => addKeyword("include")}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => removeKeyword(keyword, "include")}
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Exclude Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Exclude keyword..."
                  value={excludeKeywordInput}
                  onChange={(e) => setExcludeKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addKeyword("exclude")}
                />
                <Button size="sm" onClick={() => addKeyword("exclude")}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.excludeKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => removeKeyword(keyword, "exclude")}
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={generatePlaylist} disabled={isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Generating Playlist...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Generate Smart Playlist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Playlist Results */}
      {generatedTracks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Playlist</CardTitle>
                <CardDescription>{generatedTracks.length} tracks found matching your criteria</CardDescription>
              </div>
              <Button onClick={savePlaylist} disabled={!criteria.name}>
                <Save className="mr-2 h-4 w-4" />
                Save Playlist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Energy</TableHead>
                    <TableHead>Era</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTracks.map((track, index) => (
                    <TableRow key={track.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell>{track.artist}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{track.category}</Badge>
                      </TableCell>
                      <TableCell>{track.mood}/10</TableCell>
                      <TableCell>{track.energy}/10</TableCell>
                      <TableCell>{track.era}</TableCell>
                      <TableCell>{track.tempo}</TableCell>
                      <TableCell>
                        <Badge
                          variant={track.matchScore > 80 ? "default" : track.matchScore > 60 ? "secondary" : "outline"}
                        >
                          {Math.round(track.matchScore)}%
                        </Badge>
                      </TableCell>
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
