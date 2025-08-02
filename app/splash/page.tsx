"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Play, Radio } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()

  const handleEnter = () => {
    localStorage.setItem("isAuthenticated", "true")
    router.push("/dashboard")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                <Music className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Music Matrix</h1>
            <p className="text-white/80 text-lg">Professional Music Scheduling Interface</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <Play className="h-6 w-6 text-white mb-2" />
              <span className="text-white/90 text-sm">Playlists</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <Radio className="h-6 w-6 text-white mb-2" />
              <span className="text-white/90 text-sm">Scheduling</span>
            </div>
          </div>

          <Button
            onClick={handleEnter}
            className="w-full bg-white text-purple-900 hover:bg-white/90 font-semibold py-3"
            size="lg"
          >
            Enter Music Matrix
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
