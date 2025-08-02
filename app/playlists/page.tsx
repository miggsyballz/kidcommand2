"use client"

import { PlaylistManagerContent } from "@/components/PlaylistManagerContent"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function PlaylistsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
          <p className="text-muted-foreground">Create and manage your music playlists</p>
        </div>
        <PlaylistManagerContent />
      </div>
    </DashboardLayout>
  )
}
