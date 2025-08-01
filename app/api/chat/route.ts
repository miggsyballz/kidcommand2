import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase"

interface ScheduleRequest {
  type: "schedule"
  duration?: string
  genre?: string
  energy?: string
  instructions: string
}

interface ScheduleItem {
  id: string
  title: string
  artist: string
  duration: string
  durationSeconds: number
  startTime: string
  endTime: string
  type: "song" | "interstitial" | "break"
  notes?: string
}

interface GeneratedSchedule {
  title: string
  totalDuration: string
  totalDurationSeconds: number
  items: ScheduleItem[]
  breaks: Array<{
    afterTrack: number
    duration: string
    type: string
    notes: string
  }>
}

// Parse duration from various formats (MM:SS, M:SS, seconds)
function parseDuration(duration: string): number {
  if (!duration) return 0

  // Handle numeric seconds
  if (/^\d+$/.test(duration)) {
    return Number.parseInt(duration)
  }

  // Handle MM:SS or M:SS format
  const timeMatch = duration.match(/^(\d{1,2}):(\d{2})$/)
  if (timeMatch) {
    const minutes = Number.parseInt(timeMatch[1])
    const seconds = Number.parseInt(timeMatch[2])
    return minutes * 60 + seconds
  }

  // Handle Excel time format (decimal hours)
  const decimalMatch = duration.match(/^0\.(\d+)$/)
  if (decimalMatch) {
    const decimal = Number.parseFloat(`0.${decimalMatch[1]}`)
    return Math.round(decimal * 24 * 60 * 60) // Convert to seconds
  }

  return 0
}

// Format seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Format seconds to time display (HH:MM:SS)
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

async function fetchPlaylistEntries() {
  try {
    const { data: entries, error } = await supabase
      .from("playlist_entries")
      .select(`
        id,
        title,
        artist,
        runs,
        category,
        intro,
        ending,
        year,
        playlist_id,
        playlists!inner(name)
      `)
      .limit(1000) // Reasonable limit for context

    if (error) {
      console.error("Error fetching playlist entries:", error)
      return []
    }

    return entries || []
  } catch (error) {
    console.error("Error in fetchPlaylistEntries:", error)
    return []
  }
}

async function generateSchedule(request: ScheduleRequest, entries: any[]): Promise<GeneratedSchedule> {
  // Create context about available music
  const musicContext = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    artist: entry.artist,
    duration: entry.runs,
    category: entry.category,
    intro: entry.intro,
    ending: entry.ending,
    year: entry.year,
    playlist: entry.playlists?.name,
  }))

  const systemPrompt = `You are Kid Command AI, a specialized radio programming assistant. You help create structured show schedules based on natural language requests.

Available Music Library Context:
${JSON.stringify(musicContext.slice(0, 100), null, 2)} // Limit context size

Your task is to generate a structured schedule based on the user's request. You should:

1. Select appropriate songs from the available library
2. Calculate timing and flow
3. Insert breaks, interstitials, or special segments as requested
4. Ensure the schedule meets the requested duration and style
5. Provide detailed timing information

Respond with a JSON object in this exact format:
{
  "title": "Schedule title",
  "requestedDuration": "3:00:00",
  "selectedSongs": [
    {
      "id": "entry_id_from_library",
      "title": "Song Title",
      "artist": "Artist Name",
      "duration": "3:45",
      "reason": "Why this song was selected"
    }
  ],
  "breaks": [
    {
      "afterTrack": 5,
      "duration": "2:00",
      "type": "Commercial Break",
      "notes": "Station ID and local ads"
    }
  ],
  "notes": "Additional scheduling notes and recommendations"
}

Only select songs that exist in the provided library. Use the exact IDs from the library data.`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: `Create a radio show schedule based on this request: "${request.instructions}"

Additional context:
- Duration: ${request.duration || "Not specified"}
- Genre: ${request.genre || "Any"}
- Energy Level: ${request.energy || "Mixed"}

Please generate a structured schedule that meets these requirements.`,
  })

  // Parse the AI response
  let aiResponse
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      aiResponse = JSON.parse(jsonMatch[0])
    } else {
      throw new Error("No JSON found in response")
    }
  } catch (error) {
    console.error("Error parsing AI response:", error)
    // Fallback response
    aiResponse = {
      title: "Generated Schedule",
      selectedSongs: entries.slice(0, 10).map((entry) => ({
        id: entry.id,
        title: entry.title,
        artist: entry.artist,
        duration: entry.runs || "3:00",
        reason: "Selected from available library",
      })),
      breaks: [],
      notes: "AI response parsing failed, showing sample schedule",
    }
  }

  // Build the final schedule
  let currentTime = 0
  const scheduleItems: ScheduleItem[] = []

  // Add selected songs
  aiResponse.selectedSongs?.forEach((song: any, index: number) => {
    const durationSeconds = parseDuration(song.duration)
    const startTime = formatTime(currentTime)
    const endTime = formatTime(currentTime + durationSeconds)

    scheduleItems.push({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      durationSeconds,
      startTime,
      endTime,
      type: "song",
      notes: song.reason,
    })

    currentTime += durationSeconds

    // Check for breaks after this track
    const breakAfterThis = aiResponse.breaks?.find((b: any) => b.afterTrack === index + 1)
    if (breakAfterThis) {
      const breakDurationSeconds = parseDuration(breakAfterThis.duration)
      const breakStartTime = formatTime(currentTime)
      const breakEndTime = formatTime(currentTime + breakDurationSeconds)

      scheduleItems.push({
        id: `break_${index}`,
        title: breakAfterThis.type,
        artist: "",
        duration: breakAfterThis.duration,
        durationSeconds: breakDurationSeconds,
        startTime: breakStartTime,
        endTime: breakEndTime,
        type: "break",
        notes: breakAfterThis.notes,
      })

      currentTime += breakDurationSeconds
    }
  })

  return {
    title: aiResponse.title || "Generated Schedule",
    totalDuration: formatTime(currentTime),
    totalDurationSeconds: currentTime,
    items: scheduleItems,
    breaks: aiResponse.breaks || [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    // Check if this is a scheduling request
    const isSchedulingRequest =
      message.toLowerCase().includes("schedule") ||
      message.toLowerCase().includes("playlist") ||
      message.toLowerCase().includes("show") ||
      message.toLowerCase().includes("hour") ||
      message.toLowerCase().includes("interstitial")

    if (isSchedulingRequest) {
      // Fetch playlist entries for context
      const entries = await fetchPlaylistEntries()

      const scheduleRequest: ScheduleRequest = {
        type: "schedule",
        instructions: message,
        duration: context?.duration,
        genre: context?.genre,
        energy: context?.energy,
      }

      const schedule = await generateSchedule(scheduleRequest, entries)

      return NextResponse.json({
        message: "I've generated a structured schedule for you!",
        schedule: schedule,
        type: "schedule",
      })
    }

    // Regular chat functionality
    const systemPrompt = `You are Kid Command AI, a specialized radio programming assistant focused on MusicMaster software and radio station operations. You help radio programmers, music directors, and station managers with:

- MusicMaster software expertise (scheduling, library management, reporting)
- Radio programming strategies (playlist creation, rotation management, daypart programming)
- Music library organization and data management
- Import/export procedures and CSV handling
- Radio automation and workflow optimization
- Industry best practices for radio programming
- Natural language show scheduling and playlist generation

You provide practical, actionable advice with specific steps and examples. Always be professional, knowledgeable, and focused on radio programming solutions.

Context: You are assisting with radio programming and MusicMaster software questions.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: message,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
