"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Mic, Settings, Zap, Users } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()

  const handleEnter = () => {
    localStorage.setItem("isAuthenticated", "true")
    router.push("/dashboard")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Music Matrix</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Professional Radio Scheduling & Music Management Platform
          </p>
          <Button
            onClick={handleEnter}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Enter Music Matrix
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="bg-green-100 p-2 rounded-full w-fit mx-auto mb-2">
                <Radio className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered playlist generation and intelligent music scheduling for radio stations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="bg-purple-100 p-2 rounded-full w-fit mx-auto mb-2">
                <Mic className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Voice Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Voice-controlled music management and hands-free playlist creation</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="bg-orange-100 p-2 rounded-full w-fit mx-auto mb-2">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Advanced Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive music library management with advanced filtering and organization
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Features */}
        <div className="flex items-center justify-center space-x-8 text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Multi-User</span>
          </div>
          <div className="flex items-center space-x-2">
            <Music className="h-5 w-5" />
            <span>Professional Grade</span>
          </div>
        </div>
      </div>
    </div>
  )
}
