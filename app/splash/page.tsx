"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Brain, Zap } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnter = async () => {
    setIsLoading(true)
    // Simulate auth check/setup
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/dashboard")
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-6">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Music className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Music Matrix
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Your intelligent music production and radio programming companion
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <Radio className="h-8 w-8 text-blue-600 mx-auto" />
              <CardTitle className="text-lg">Smart Library</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize and manage your music collection with intelligent categorization
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <Brain className="h-8 w-8 text-purple-600 mx-auto" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Get intelligent recommendations and automate your workflow</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <Zap className="h-8 w-8 text-green-600 mx-auto" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Streamline your production process with powerful automation tools</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleEnter}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Enter Music Matrix"}
          </Button>
          <p className="text-sm text-muted-foreground">Ready to revolutionize your music workflow?</p>
        </div>
      </div>
    </div>
  )
}
