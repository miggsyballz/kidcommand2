import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Initialize OpenAI client with error handling
let openaiClient: any | null = null

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = openai(process.env.OPENAI_API_KEY)
    console.log("✅ OpenAI client initialized successfully")
  } else {
    console.log("⚠️ OpenAI API key not found - AI features will be disabled")
  }
} catch (error) {
  console.error("❌ Failed to initialize OpenAI client:", error)
}

export async function POST(request: NextRequest) {
  try {
    const { message, brainEntries = [] } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Build system prompt with brain entries
    let systemPrompt = `You are MusicMaster AI, an intelligent assistant for music playlist management and organization. You help users with:

1. **Playlist Management**: Creating, organizing, and managing music playlists
2. **Music Organization**: Sorting, categorizing, and structuring music libraries
3. **Data Analysis**: Analyzing music data, trends, and patterns
4. **Workflow Optimization**: Streamlining music production and management workflows

You are knowledgeable, helpful, and focused on music-related tasks. Always provide practical, actionable advice.`

    // Add brain entries to system prompt if available
    if (brainEntries && brainEntries.length > 0) {
      systemPrompt += `\n\n**KNOWLEDGE BASE:**\nYou have access to the following specific knowledge entries that should guide your responses:\n\n`

      brainEntries.forEach((entry: any, index: number) => {
        systemPrompt += `${index + 1}. **${entry.category}** - ${entry.command}\n`
        systemPrompt += `   Instructions: ${entry.instructions}\n`
        if (entry.example) {
          systemPrompt += `   Example: ${entry.example}\n`
        }
        if (entry.tags && entry.tags.length > 0) {
          systemPrompt += `   Tags: ${entry.tags.join(", ")}\n`
        }
        systemPrompt += "\n"
      })

      systemPrompt += `When responding to user queries, prioritize information from this knowledge base when relevant. If a user's question matches or relates to any of these entries, use the provided instructions and examples.`
    }

    // Generate response using OpenAI
    const { text } = await generateText({
      model: openaiClient,
      system: systemPrompt,
      prompt: message,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("AI Chat API Error:", error)

    // Handle specific OpenAI errors
    if (error?.code === "insufficient_quota") {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check your billing settings." },
        { status: 429 },
      )
    }

    if (error?.code === "invalid_api_key") {
      return NextResponse.json({ error: "Invalid OpenAI API key. Please check your configuration." }, { status: 401 })
    }

    if (error?.code === "model_not_found") {
      return NextResponse.json(
        { error: "OpenAI model not found. Please check your model configuration." },
        { status: 400 },
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: error?.message || "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST to send messages." }, { status: 405 })
}
