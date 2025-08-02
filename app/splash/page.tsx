"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Radio, Brain, Calendar } from "lucide-react"

export default function SplashPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, no credentials needed - just set auth and redirect
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userEmail", email || "mig@maxxbeats.com")
    setIsLoginOpen(false)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">Music Matrix</h1>
          <h2 className="text-2xl md:text-3xl text-blue-200 font-light">AI Driven Radio Scheduling System</h2>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Music className="h-8 w-8 text-blue-300 mx-auto" />
              <CardTitle className="text-white">Smart Library</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200">AI-powered music organization and management</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Calendar className="h-8 w-8 text-purple-300 mx-auto" />
              <CardTitle className="text-white">Auto Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200">
                Intelligent playlist generation and scheduling
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Radio className="h-8 w-8 text-green-300 mx-auto" />
              <CardTitle className="text-white">Radio Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200">Professional radio station management tools</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Brain className="h-8 w-8 text-yellow-300 mx-auto" />
              <CardTitle className="text-white">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200">Voice-powered music discovery and control</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="mt-12">
          <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Enter Music Matrix
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Welcome to Music Matrix</DialogTitle>
                <DialogDescription>Sign in to access your AI-powered radio scheduling system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Footer */}
        <div className="mt-16 text-blue-300 text-sm">
          <p>Powered by MaxxBeats.com | Professional Music Production Services</p>
        </div>
      </div>
    </div>
  )
}
