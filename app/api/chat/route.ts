import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    const systemPrompt = `You are Kid Command AI, a specialized radio programming assistant focused on MusicMaster software and radio station operations. You help radio programmers, music directors, and station managers with:

- MusicMaster software expertise (scheduling, library management, reporting)
- Radio programming strategies (playlist creation, rotation management, daypart programming)
- Music library organization and data management
- Import/export procedures and CSV handling
- Radio automation and workflow optimization
- Industry best practices for radio programming

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
