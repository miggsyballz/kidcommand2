import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai

export async function generateChatResponse(message: string, context?: any) {
  try {
    const systemPrompt = `You are Kid Command AI, a specialized radio programming assistant for radio professionals. You help with:

- MusicMaster software expertise and troubleshooting
- Playlist management and rotation strategies  
- Radio programming workflows and best practices
- Music library organization and data management

${context ? `Current user context: ${JSON.stringify(context, null, 2)}` : ""}

Provide practical, actionable advice specific to radio programming and MusicMaster workflows. Be professional but friendly.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "Sorry, I could not generate a response."
  } catch (error) {
    console.error("OpenAI Error:", error)
    throw new Error("Failed to generate AI response")
  }
}
