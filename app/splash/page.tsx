"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Calendar, BarChart3 } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()

  const handleEnter = () => {
    localStorage.setItem("isAuthenticated", "true")
    router.push("/dashboard")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Music Matrix</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Professional Radio Scheduling & Music Management Platform
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <Radio className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>AI-powered music scheduling with rotation rules and category management</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Playlist Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, edit, and manage playlists with advanced filtering and organization
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Track performance, analyze trends, and optimize your music programming</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          <Button
            onClick={handleEnter}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Enter Music Matrix
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400">Professional radio scheduling made simple</p>
        </div>
      </div>
    </div>
  )
}
