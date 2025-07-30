"use client"

import { useState } from "react"
import { Brain, Sparkles, Music, Zap, TrendingUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface AnalysisResult {
  id: string
  title: string
  artist: string
  aiSuggestions: {
    mood: number
    energy: number
    era: number
    tempo: number
    category: string
    keywords: string[]
    role: string
    sound: string
    type: string
  }
  confidence: number
}

interface AIAnalyzerProps {
  onAnalysisComplete?: (results: AnalysisResult[]) => void
}

export function AIMusicAnalyzer({ onAnalysisComplete }: AIAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"missing" | "all" | "playlist">("missing")
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([])

  // Fetch playlists on component mount
  useState(() => {
    const fetchPlaylists = async () => {
      const { data } = await supabase.from("playlists").select("id, name").order("name")
      if (data) setPlaylists(data)
    }
    fetchPlaylists()
  })

  const analyzeWithAI = async (entries: any[]) => {
    // Simulate AI analysis - in real implementation, this would call an AI service
    const results: AnalysisResult[] = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      setProgress((i / entries.length) * 100)

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock AI analysis based on title and artist
      const mockAnalysis = generateMockAnalysis(entry.Title || entry.title, entry.Artist || entry.artist)

      results.push({
        id: entry.id,
        title: entry.Title || entry.title,
        artist: entry.Artist || entry.artist,
        aiSuggestions: mockAnalysis,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      })
    }

    return results
  }

  const generateMockAnalysis = (title: string, artist: string) => {
    // Mock AI analysis based on keywords in title/artist
    const titleLower = title?.toLowerCase() || ""
    const artistLower = artist?.toLowerCase() || ""

    let mood = 5
    let energy = 5
    const era = 2010
    let tempo = 120
    let category = "Pop"
    const keywords = ["music"]
    const role = "Main"
    let sound = "Digital"
    const type = "Song"

    // Analyze title for mood indicators
    if (titleLower.includes("love") || titleLower.includes("heart")) {
      mood = 8
      keywords.push("romantic", "emotional")
    }
    if (titleLower.includes("party") || titleLower.includes("dance")) {
      energy = 9
      tempo = 128
      keywords.push("party", "dance")
    }
    if (titleLower.includes("sad") || titleLower.includes("cry")) {
      mood = 2
      energy = 3
      keywords.push("melancholy", "emotional")
    }
    if (titleLower.includes("rock") || titleLower.includes("metal")) {
      category = "Rock"
      energy = 8
      tempo = 140
      sound = "Electric"
    }
    if (titleLower.includes("chill") || titleLower.includes("relax")) {
      energy = 3
      mood = 6
      tempo = 90
      keywords.push("chill", "ambient")
    }

    // Analyze artist for genre indicators
    if (artistLower.includes("dj") || artistLower.includes("electronic")) {
      category = "Electronic"
      sound = "Synthesized"
      tempo = 125
    }

    return {
      mood,
      energy,
      era,
      tempo,
      category,
      keywords,
      role,
      sound,
      type,
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setResults([])

    try {
      // Fetch entries based on analysis mode
      let query = supabase.from("playlist_entries").select("*")

      if (analysisMode === "missing") {
        query = query.or("Mood.is.null,Energy.is.null,Era.is.null,Tempo.is.null")
      } else if (analysisMode === "playlist" && selectedPlaylist) {
        query = query.eq("playlist_id", selectedPlaylist)
      }

      const { data: entries, error } = await query.limit(50) // Limit for demo

      if (error) throw error

      if (!entries || entries.length === 0) {
        throw new Error("No entries found to analyze")
      }

      const analysisResults = await analyzeWithAI(entries)
      setResults(analysisResults)

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResults)
      }
    } catch (err) {
      console.error("Analysis failed:", err)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const applyAISuggestions = async (result: AnalysisResult) => {
    try {
      const { error } = await supabase
        .from("playlist_entries")
        .update({
          Mood: result.aiSuggestions.mood,
          Energy: result.aiSuggestions.energy,
          Era: result.aiSuggestions.era,
          Tempo: result.aiSuggestions.tempo,
          Catergory: result.aiSuggestions.category,
          Keywords: result.aiSuggestions.keywords.join(", "),
          Role: result.aiSuggestions.role,
          Sound: result.aiSuggestions.sound,
          Type: result.aiSuggestions.type,
        })
        .eq("id", result.id)

      if (error) throw error

      // Remove from results after applying
      setResults((prev) => prev.filter((r) => r.id !== result.id))
    } catch (err) {
      console.error("Failed to apply suggestions:", err)
    }
  }

  const applyAllSuggestions = async () => {
    for (const result of results) {
      await applyAISuggestions(result)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Music Analyzer
          </CardTitle>
          <CardDescription>Use AI to automatically analyze and categorize your music data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Mode</label>
              <Select
                value={analysisMode}
                onValueChange={(value: "missing" | "all" | "playlist") => setAnalysisMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Missing Data Only
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      All Entries
                    </div>
                  </SelectItem>
                  <SelectItem value="playlist">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Specific Playlist
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analysisMode === "playlist" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Playlist</label>
                <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose playlist..." />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Analysis Prompt (Optional)</label>
            <Textarea
              placeholder="e.g., 'Focus on identifying workout music with high energy levels...'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analyzing music data...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (analysisMode === "playlist" && !selectedPlaylist)}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start AI Analysis
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button onClick={applyAllSuggestions} variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Apply All ({results.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
            <CardDescription>Review and apply AI suggestions for your music data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.title}</h4>
                      <p className="text-sm text-muted-foreground">{result.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{Math.round(result.confidence * 100)}% confidence</Badge>
                      <Button size="sm" onClick={() => applyAISuggestions(result)}>
                        Apply
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Mood:</span> {result.aiSuggestions.mood}/10
                    </div>
                    <div>
                      <span className="font-medium">Energy:</span> {result.aiSuggestions.energy}/10
                    </div>
                    <div>
                      <span className="font-medium">Era:</span> {result.aiSuggestions.era}
                    </div>
                    <div>
                      <span className="font-medium">Tempo:</span> {result.aiSuggestions.tempo} BPM
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {result.aiSuggestions.category}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {result.aiSuggestions.role}
                    </div>
                    <div>
                      <span className="font-medium">Sound:</span> {result.aiSuggestions.sound}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {result.aiSuggestions.type}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-sm">Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.aiSuggestions.keywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
