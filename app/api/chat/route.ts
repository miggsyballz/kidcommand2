import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get relevant context from database if needed
    let dbContext = null
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("playlist") || lowerMessage.includes("library") || lowerMessage.includes("stats")) {
      try {
        // Fetch relevant data for context
        const [playlistsResult, songsResult] = await Promise.all([
          supabase.from("playlists").select("name, song_count").limit(10),
          supabase.from("playlist_entries").select("Title, Artist, Catergory, Energy, Tempo").limit(20),
        ])

        dbContext = {
          playlists: playlistsResult.data || [],
          recentSongs: songsResult.data || [],
          playlistCount: playlistsResult.data?.length || 0,
          songCount: songsResult.data?.length || 0,
        }
      } catch (dbError) {
        console.error("Database context error:", dbError)
        // Continue without database context
      }
    }

    const systemPrompt = `You are an AI music production assistant for Mr. Mig, a music producer who runs MaxxBeats.com where he sells instrumentals, plugins, music production services, and courses.

Your role is to help with:
- Beat making and music production advice
- Business guidance for MaxxBeats.com
- Playlist organization and music library management
- Client relations and pricing strategies
- Plugin recommendations and workflow optimization
- Music industry trends and marketing

Keep responses concise, practical, and focused on music production. Use emojis and formatting to make responses engaging. Always consider the context of a professional music producer's needs.

Current context: ${context ? JSON.stringify(context) : "General music production assistance"}
Database context: ${dbContext ? JSON.stringify(dbContext) : "No database context available"}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse =
      completion.choices[0]?.message?.content || "I'm having trouble generating a response right now. Please try again!"

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error("Chat API Error:", error)

    // Provide specific error messages
    if (error.code === "invalid_api_key") {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable." },
        { status: 401 },
      )
    }

    if (error.code === "insufficient_quota") {
      return NextResponse.json({ error: "OpenAI API quota exceeded. Please check your billing." }, { status: 429 })
    }

    return NextResponse.json(
      { error: `Failed to generate AI response: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
