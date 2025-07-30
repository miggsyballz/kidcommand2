"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, MicOff, Volume2, VolumeX, Trash2, AlertCircle, CheckCircle2, Loader2, HelpCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { VoiceCommand, SpeechRecognitionEvent } from "@/types/speech"

interface AIVoiceAssistantProps {
  onCommandExecuted?: (command: string, response: string) => void
}

export function AIVoiceAssistant({ onCommandExecuted }: AIVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      synthRef.current = window.speechSynthesis
    } else {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.")
    }
  }, [])

  const speak = (text: string) => {
    if (!audioEnabled || !synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const processVoiceCommand = async (transcript: string): Promise<string> => {
    const command = transcript.toLowerCase().trim()

    try {
      // Create playlist command
      if (command.includes("create playlist") || command.includes("make playlist")) {
        const playlistName = command.replace(/create playlist|make playlist|called|named/g, "").trim()
        if (playlistName) {
          const { data, error } = await supabase
            .from("playlists")
            .insert({
              name: playlistName,
              status: "active",
              song_count: 0,
              source_file: "Voice Command",
            })
            .select()
            .single()

          if (error) throw error
          return `Created playlist "${playlistName}" successfully!`
        }
        return "Please specify a playlist name. Try saying 'Create playlist called Workout Music'"
      }

      // Show playlists command
      if (command.includes("show") && (command.includes("playlist") || command.includes("playlists"))) {
        const { data, error } = await supabase
          .from("playlists")
          .select("name, song_count")
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error

        if (!data || data.length === 0) {
          return "You don't have any playlists yet. Try creating one first!"
        }

        const playlistList = data.map((p) => `${p.name} with ${p.song_count} songs`).join(", ")
        return `You have ${data.length} playlists: ${playlistList}`
      }

      // Search songs command
      if (command.includes("search") || command.includes("find")) {
        let searchTerm = ""
        if (command.includes("by ")) {
          searchTerm = command.split("by ")[1]
        } else if (command.includes("for ")) {
          searchTerm = command.split("for ")[1]
        }

        if (searchTerm) {
          const { data, error } = await supabase
            .from("playlist_entries")
            .select("Title, Artist")
            .or(`Title.ilike.%${searchTerm}%,Artist.ilike.%${searchTerm}%`)
            .limit(5)

          if (error) throw error

          if (!data || data.length === 0) {
            return `No songs found matching "${searchTerm}"`
          }

          const songList = data.map((s) => `${s.Title} by ${s.Artist}`).join(", ")
          return `Found ${data.length} songs: ${songList}`
        }
        return "Please specify what to search for. Try saying 'Search for songs by Drake'"
      }

      // Library stats command
      if (command.includes("stats") || command.includes("how many") || command.includes("library")) {
        const { data: songs, error: songsError } = await supabase.from("playlist_entries").select("id")

        const { data: playlists, error: playlistsError } = await supabase.from("playlists").select("id")

        if (songsError || playlistsError) throw songsError || playlistsError

        return `Your library has ${songs?.length || 0} songs across ${playlists?.length || 0} playlists`
      }

      // Help command
      if (command.includes("help") || command.includes("commands")) {
        return "I can help you with: Create playlist called [name], Show my playlists, Search for songs by [artist], Library stats, and more!"
      }

      // Default response
      return "I didn't understand that command. Try saying 'Help' to see what I can do, or 'Create playlist called My Music' to get started."
    } catch (error) {
      console.error("Error processing voice command:", error)
      return "Sorry, I encountered an error processing that command. Please try again."
    }
  }

  const startListening = () => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"
    recognitionRef.current.maxAlternatives = 1

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setError(null)
      setCurrentTranscript("")
    }

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCurrentTranscript(transcript)
    }

    recognitionRef.current.onend = async () => {
      setIsListening(false)

      if (currentTranscript.trim()) {
        setIsProcessing(true)

        try {
          const response = await processVoiceCommand(currentTranscript)

          const newCommand: VoiceCommand = {
            command: currentTranscript,
            confidence: 0.9, // Simplified confidence
            timestamp: new Date(),
            response,
          }

          setCommands((prev) => [newCommand, ...prev])

          if (audioEnabled) {
            speak(response)
          }

          if (onCommandExecuted) {
            onCommandExecuted(currentTranscript, response)
          }
        } catch (error) {
          setError("Failed to process voice command")
        } finally {
          setIsProcessing(false)
          setCurrentTranscript("")
        }
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false)
      setIsProcessing(false)
      setError(`Speech recognition error: ${event.error}`)
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const clearHistory = () => {
    setCommands([])
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Voice Assistant Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice
              features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Voice Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Assistant
          </CardTitle>
          <CardDescription>Speak naturally to control your music library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  isListening
                    ? "bg-red-100 dark:bg-red-900/20 animate-pulse"
                    : isProcessing
                      ? "bg-blue-100 dark:bg-blue-900/20"
                      : isSpeaking
                        ? "bg-green-100 dark:bg-green-900/20 animate-pulse"
                        : "bg-muted"
                }`}
              >
                {isListening ? (
                  <Mic className="h-8 w-8 text-red-600" />
                ) : isProcessing ? (
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                ) : isSpeaking ? (
                  <Volume2 className="h-8 w-8 text-green-600" />
                ) : (
                  <MicOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isListening ? "Listening..." : isProcessing ? "Processing..." : isSpeaking ? "Speaking..." : "Ready"}
              </p>
            </div>
          </div>

          {/* Current Transcript */}
          {currentTranscript && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Hearing:</strong> {currentTranscript}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "default"}
              size="lg"
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Listening
                </>
              )}
            </Button>

            <Button onClick={toggleAudio} variant="outline" size="lg">
              {audioEnabled ? (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Audio On
                </>
              ) : (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Audio Off
                </>
              )}
            </Button>
          </div>

          {/* Help */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                speak(
                  "I can help you create playlists, search for songs, show library stats, and more. Try saying create playlist called workout music.",
                )
              }
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Voice Commands Help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Command History
            </CardTitle>
            {commands.length > 0 && (
              <Button onClick={clearHistory} variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No voice commands yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try saying "Create playlist called My Music" or "Show my playlists"
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {commands.map((cmd, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {cmd.timestamp.toLocaleTimeString()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(cmd.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>You said:</strong> "{cmd.command}"
                      </p>
                      {cmd.response && (
                        <p className="text-sm text-muted-foreground">
                          <strong>AI responded:</strong> {cmd.response}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
