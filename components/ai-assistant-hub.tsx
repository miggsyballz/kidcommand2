"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AIVoiceAssistant } from "./ai-voice-assistant"
import { AIChatAssistant } from "./ai-chat-assistant"
import { Mic, MessageSquare, Zap, Brain } from "lucide-react"

export function AIAssistantHub() {
  const [activeTab, setActiveTab] = useState("chat")
  const [activityCount, setActivityCount] = useState({ voice: 0, chat: 0 })

  const handleVoiceCommand = (command: string, response: string) => {
    setActivityCount((prev) => ({ ...prev, voice: prev.voice + 1 }))
  }

  const handleChatAction = (action: string, data: any) => {
    setActivityCount((prev) => ({ ...prev, chat: prev.chat + 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your intelligent music companion. Use voice commands or chat naturally to manage your playlists, search your
          library, and get insights about your music collection.
        </p>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activityCount.voice + activityCount.chat}</p>
                <p className="text-xs text-muted-foreground">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activityCount.voice}</p>
                <p className="text-xs text-muted-foreground">Voice Commands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activityCount.chat}</p>
                <p className="text-xs text-muted-foreground">Chat Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Assistant
            {activityCount.chat > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activityCount.chat}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Assistant
            {activityCount.voice > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activityCount.voice}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <AIChatAssistant onActionExecuted={handleChatAction} />
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <AIVoiceAssistant onCommandExecuted={handleVoiceCommand} />
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Capabilities
          </CardTitle>
          <CardDescription>What your AI assistant can help you with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                Chat Assistant
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Natural language conversations</li>
                <li>• Smart playlist management</li>
                <li>��� Advanced music search</li>
                <li>• Library analytics and insights</li>
                <li>• AI-powered recommendations</li>
                <li>• Export chat history</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-600" />
                Voice Assistant
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hands-free voice commands</li>
                <li>• Real-time speech recognition</li>
                <li>• Audio responses and feedback</li>
                <li>• Command history tracking</li>
                <li>• Perfect for music production workflow</li>
                <li>• Works while you're mixing or playing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
