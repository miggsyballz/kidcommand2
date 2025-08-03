"use client"
import { PlaylistManagerContent } from "./playlist-manager-content"
import { UploadDataContent } from "./upload-data-content"
import { SettingsContent } from "./settings-content"

interface DashboardCoordinatorProps {
  activeView: string
}

export function DashboardCoordinator({ activeView }: DashboardCoordinatorProps) {
  const renderContent = () => {
    switch (activeView) {
      case "playlists":
        return <PlaylistManagerContent />
      case "upload-data":
        return <UploadDataContent />
      case "settings":
        return <SettingsContent />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Music Matrix</h2>
              <p className="text-muted-foreground">Select a section from the sidebar to get started.</p>
            </div>
          </div>
        )
    }
  }

  return <div className="w-full">{renderContent()}</div>
}
