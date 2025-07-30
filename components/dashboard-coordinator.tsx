"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "./dashboard-layout"
import { PlaylistManagerContent } from "./playlist-manager-content"
import { LibraryContent } from "./LibraryContent"
import { UploadDataContent } from "./upload-data-content"
import { AIAssistantHub } from "./ai-assistant-hub"
import { SettingsContent } from "./settings-content"

export function DashboardCoordinator() {
  const [activeTab, setActiveTab] = useState("playlists")

  // Update active tab based on current route
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("/library")) setActiveTab("library")
    else if (path.includes("/upload-data")) setActiveTab("upload-data")
    else if (path.includes("/ai-assistant")) setActiveTab("ai-assistant")
    else if (path.includes("/settings")) setActiveTab("settings")
    else setActiveTab("playlists")
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "playlists":
        return <PlaylistManagerContent />
      case "library":
        return <LibraryContent />
      case "upload-data":
        return <UploadDataContent />
      case "ai-assistant":
        return <AIAssistantHub />
      case "settings":
        return <SettingsContent />
      default:
        return <PlaylistManagerContent />
    }
  }

  return <DashboardLayout activeTab={activeTab}>{renderContent()}</DashboardLayout>
}
