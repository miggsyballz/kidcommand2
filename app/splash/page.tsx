"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Calendar, BarChart3 } from "lucide-react"

export default function SplashPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleEnter = async () => {
    setIsLoading(true)

    // Set authentication state
    localStorage.setItem("isAuthenticated", "true")

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Navigate to dashboard
    window.location.href = "/dashboard"
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-6">
        <div className="text-center space-y-8">
          {/* Logo and Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Music className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">Music Matrix</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Professional Music Scheduling & Playlist Management
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <Radio className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>AI-powered music scheduling with intelligent rotation and timing</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Playlist Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create, edit, and organize playlists with advanced filtering and sorting
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Track performance metrics and optimize your music programming</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button
              onClick={handleEnter}
              disabled={isLoading}
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? "Loading..." : "Enter Music Matrix"}
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Built for music professionals by Mr. Mig</p>
          </div>
        </div>
      </div>
    </div>
  )
}
