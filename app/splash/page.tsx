"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Zap, Brain, Headphones } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnter = async () => {
    setIsLoading(true)
    // Set authentication state
    localStorage.setItem("isAuthenticated", "true")

    // Navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Music className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Music Matrix</h1>
          <p className="text-xl text-white/80 mb-8">AI-Driven Radio Scheduling Interface</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <Radio className="h-8 w-8 mb-2 text-blue-400" />
              <CardTitle className="text-lg">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/70">
                AI-powered playlist generation and radio scheduling automation
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-purple-400" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/70">
                Voice-enabled AI assistant for music curation and management
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-yellow-400" />
              <CardTitle className="text-lg">Real-time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/70">
                Live playlist updates and seamless music library management
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleEnter}
          disabled={isLoading}
          size="lg"
          className="bg-white text-slate-900 hover:bg-white/90 px-8 py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mr-2"></div>
              Loading...
            </>
          ) : (
            <>
              <Headphones className="mr-2 h-5 w-5" />
              Enter Music Matrix
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="mt-12 text-white/60 text-sm">
          <p>Powered by AI • Built for Radio Professionals</p>
        </div>
      </div>
    </div>
  )
}
