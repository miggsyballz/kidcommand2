import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    // Get system prompt from localStorage (in a real app, this would be from database)
    const systemPrompt = `You are Kid Kelly's AI assistant for Kid Command Radio Station. You help manage playlists, analyze music data, and provide insights about the radio station's music library.

Key responsibilities:
- Help create and manage playlists
- Analyze music trends and patterns
- Suggest songs based on criteria
- Provide radio programming insights
- Answer questions about the music library

Always be helpful, professional, and focused on radio station operations.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: message,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("AI Chat Error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
