"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIMusicAnalyzer } from "@/components/ai-music-analyzer"
import { SmartPlaylistGenerator } from "@/components/smart-playlist-generator"
import { PromptBuilderContent } from "@/components/prompt-builder-content"
import { AIVoiceAssistant } from "@/components/ai-voice-assistant"
import { AIChatAssistant } from "@/components/ai-chat-assistant"

export default function PromptBuilderPage() {
  const handleVoiceCommand = (command: string, result: any) => {
    console.log("Voice command executed:", command, result)
    // You can add additional logic here to update the UI or trigger other actions
  }

  const handleChatAction = (action: string, data: any) => {
    console.log("Chat action executed:", action, data)
    // You can add additional logic here to update the UI or trigger other actions
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI & Prompt Builder</h1>
        <p className="text-muted-foreground">
          Use AI to analyze, sort, and generate intelligent playlists from your music library. Control everything with
          voice commands or chat naturally with AI.
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="voice">Voice Control</TabsTrigger>
          <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger>
          <TabsTrigger value="generator">Smart Playlists</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <AIChatAssistant onActionExecuted={handleChatAction} />
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <AIVoiceAssistant onCommandExecuted={handleVoiceCommand} />
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-4">
          <AIMusicAnalyzer />
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <SmartPlaylistGenerator />
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <PromptBuilderContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
