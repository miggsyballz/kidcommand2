"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Music } from "lucide-react"

export default function SplashPage() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, no credentials needed - just set auth and redirect
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userEmail", email || "user@musicmatrix.com")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo and Branding */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <Music className="h-16 w-16 text-white" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">Music Matrix</h1>

          <h2 className="text-2xl text-blue-200 mb-8 font-light">AI Driven Radio Scheduling System</h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Revolutionize your radio programming with intelligent playlist management, AI-powered scheduling, and
            comprehensive music library organization.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">AI-powered playlist generation and radio show scheduling</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Music Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">Comprehensive music management and organization system</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">Voice-enabled AI assistant for music production guidance</p>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90 px-8 py-3 text-lg font-semibold">
              Get Started
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Welcome to Music Matrix</DialogTitle>
              <DialogDescription>Enter your credentials to access the system</DialogDescription>
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

        {/* Footer */}
        <div className="mt-16 text-white/60 text-sm">
          <p>Powered by MaxxBeats.com</p>
        </div>
      </div>
    </div>
  )
}
