"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Upload, Library, Settings, TrendingUp, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DashboardLayout } from "@/components/dashboard-layout"

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
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Mig!</h1>
            <p className="text-muted-foreground">Here's what's happening with your music library today.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
              <p className="text-xs text-muted-foreground">Active playlists</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Songs in Library</CardTitle>
              <Library className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSongs}</div>
              <p className="text-xs text-muted-foreground">Total tracks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUploads}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start building a new playlist for your show</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <Music className="h-6 w-6" />
              Create New Playlist
            </Button>
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <Upload className="h-6 w-6" />
              Upload Music
            </Button>
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <Library className="h-6 w-6" />
              Browse Library
            </Button>
            <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
              <Settings className="h-6 w-6" />
              Settings
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground">Start by creating a playlist or uploading music</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
