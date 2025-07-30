import { NextResponse } from "next/server"
import { testOpenAIConnection } from "@/lib/openai"

export async function GET() {
  try {
    const result = await testOpenAIConnection()

    if (result.success) {
      return NextResponse.json({
        connected: true,
        message: "OpenAI API connection successful",
      })
    } else {
      return NextResponse.json(
        {
          connected: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || "Connection test failed",
      },
      { status: 500 },
    )
  }
}
