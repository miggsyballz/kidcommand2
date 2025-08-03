"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Headphones } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnter = async () => {
    setIsLoading(true)

    // Simulate authentication
    localStorage.setItem("isAuthenticated", "true")

    // Navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-white mb-2">Music Matrix</CardTitle>
            <CardDescription className="text-white/80 text-lg">Professional Radio Scheduling Interface</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/90 text-sm font-medium">Smart Scheduling</p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/90 text-sm font-medium">AI Assistant</p>
            </div>
          </div>

          <Button
            onClick={handleEnter}
            disabled={isLoading}
            className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold py-3 text-lg"
          >
            {isLoading ? "Loading..." : "Enter Music Matrix"}
          </Button>

          <p className="text-center text-white/60 text-sm">Welcome to your professional radio scheduling platform</p>
        </CardContent>
      </Card>
    </div>
  )
}
