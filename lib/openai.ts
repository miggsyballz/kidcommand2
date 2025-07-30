import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "OPENAI_API_KEY environment variable not set" }
    }

    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5,
    })

    if (completion.choices[0]?.message?.content) {
      return { success: true }
    } else {
      return { success: false, error: "No response from OpenAI" }
    }
  } catch (error: any) {
    console.error("OpenAI connection test failed:", error)
    return {
      success: false,
      error: error.message || "Unknown connection error",
    }
  }
}

export async function generateAIResponse(userMessage: string, context?: any) {
  try {
    const systemPrompt = `You are an AI music production assistant for Mr. Mig, a music producer who runs MaxxBeats.com where he sells instrumentals, plugins, music production services, and courses.

Your role is to help with:
- Beat making and music production advice
- Business guidance for MaxxBeats.com
- Playlist organization and music library management
- Client relations and pricing strategies
- Plugin recommendations and workflow optimization
- Music industry trends and marketing

Keep responses concise, practical, and focused on music production. Use emojis and formatting to make responses engaging. Always consider the context of a professional music producer's needs.

Current context: ${context ? JSON.stringify(context) : "General music production assistance"}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return (
      completion.choices[0]?.message?.content || "I'm having trouble generating a response right now. Please try again!"
    )
  } catch (error) {
    console.error("OpenAI API Error:", error)
    throw error
  }
}

export async function generateMusicAnalysis(musicData: any[]) {
  try {
    const dataString = musicData
      .map(
        (track) =>
          `${track.Title} by ${track.Artist} - Genre: ${track.Catergory || "Unknown"}, Energy: ${track.Energy || "N/A"}, BPM: ${track.Tempo || "N/A"}`,
      )
      .join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a music industry analyst. Analyze the provided music data and give insights about genre distribution, energy levels, BPM patterns, and market trends. Focus on actionable insights for a music producer.",
        },
        {
          role: "user",
          content: `Analyze this music library data:\n\n${dataString}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.6,
    })

    return completion.choices[0]?.message?.content || "Unable to analyze the music data at this time."
  } catch (error) {
    console.error("OpenAI Analysis Error:", error)
    throw error
  }
}
