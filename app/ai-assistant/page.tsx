"use client"

import { AIAssistantHub } from "@/components/ai-assistant-hub"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AIAssistantPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground">Get help with music production and radio programming</p>
        </div>
        <AIAssistantHub />
      </div>
    </DashboardLayout>
  )
}
