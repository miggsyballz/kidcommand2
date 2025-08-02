"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCoordinator } from "@/components/dashboard-coordinator"

interface DashboardStats {
  totalPlaylists: number
  totalSongs: number
  recentUploads: number
}

interface RecentActivity {
  id: string
  type: "playlist_created" | "songs_uploaded" | "playlist_updated"
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPlaylists: 0,
    totalSongs: 0,
    recentUploads: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated")
      if (authStatus === "true") {
        setIsAuthenticated(true)
        loadDashboardData()
      } else {
        router.push("/splash")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const loadDashboardData = async () => {
    try {
      // Load playlist count
      const { count: playlistCount } = await supabase.from("playlists").select("*", { count: "exact", head: true })

      // Load total songs count
      const { count: songsCount } = await supabase.from("playlist_entries").select("*", { count: "exact", head: true })

      // Load recent uploads (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentCount } = await supabase
        .from("playlist_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())

      setStats({
        totalPlaylists: playlistCount || 0,
        totalSongs: songsCount || 0,
        recentUploads: recentCount || 0,
      })

      // Load recent activity
      const { data: recentPlaylists } = await supabase
        .from("playlists")
        .select("id, name, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(5)

      const activities: RecentActivity[] = []

      if (recentPlaylists) {
        recentPlaylists.forEach((playlist) => {
          activities.push({
            id: `playlist-${playlist.id}`,
            type: "playlist_created",
            description: `New playlist "${playlist.name}" created`,
            timestamp: new Date(playlist.created_at).toLocaleString(),
          })
        })
      }

      setRecentActivity(activities)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Music Matrix...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <DashboardLayout>
      <DashboardCoordinator />
    </DashboardLayout>
  )
}
