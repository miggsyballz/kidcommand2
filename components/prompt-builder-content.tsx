"use client"

import { useState } from "react"
import { Loader2, Sparkles, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface GeneratedTrack {
  id: string
  title: string
  artist: string
  genre: string
  duration: string
  bpm: number
}

interface PromptBuilderContentProps {
  onGeneratePlaylist?: (prompt: string) => Promise<GeneratedTrack[]>
}

export function PromptBuilderContent({ onGeneratePlaylist }: PromptBuilderContentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedTrack[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt to generate a playlist.")
      return
    }

    setIsLoading(true)
    setHasGenerated(false)

    try {
      if (onGeneratePlaylist) {
        const playlist = await onGeneratePlaylist(prompt)
        setGeneratedPlaylist(playlist)
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setGeneratedPlaylist([])
      }
      setHasGenerated(true)
    } catch (error) {
      console.error("Error generating playlist:", error)
      alert("Failed to generate playlist. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (duration: string) => {
    return duration
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Prompt Builder
        </CardTitle>
        <CardDescription>
          Describe the type of playlist you want to generate and let AI create it for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt-input">Playlist Prompt</Label>
          <Textarea
            id="prompt-input"
            placeholder="Describe your ideal playlist... (e.g., 'Create a chill lo-fi hip hop playlist for studying with 10 tracks around 120 BPM')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be specific about genre, mood, tempo, or any other preferences
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading || !prompt.trim()} className="min-w-40">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Playlist
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Generating your playlist...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Generated Playlist Table */}
        {hasGenerated && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Generated Playlist</h3>
            </div>

            {generatedPlaylist.length === 0 ? (
              <div className="text-center py-8">
                <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-4">
                  <Music className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-2">No tracks generated</h4>
                <p className="text-sm text-muted-foreground">Try refining your prompt or check your connection</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Track</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>BPM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedPlaylist.map((track, index) => (
                      <TableRow key={track.id || index}>
                        <TableCell className="font-medium">{track.title}</TableCell>
                        <TableCell>{track.artist}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                            {track.genre}
                          </span>
                        </TableCell>
                        <TableCell>{formatDuration(track.duration)}</TableCell>
                        <TableCell>{track.bpm}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
