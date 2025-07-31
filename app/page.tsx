"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Upload, Library, Settings, TrendingUp, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DashboardStats {
  totalPlaylists: number
  songsInLibrary: number
  recentUploads: number
  playlistsThisWeek: number
  songsThisMonth: number
  uploadsToday: number
}

interface RecentActivity {
  id: string
  type: "playlist_created" | "songs_uploaded" | "playlist_updated"
  description: string
  timestamp: string
  details?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlaylists: 0,
    songsInLibrary: 0,
    recentUploads: 0,
    playlistsThisWeek: 0,
    songsThisMonth: 0,
    uploadsToday: 0,
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch total playlists
      const { count: totalPlaylists } = await supabase.from("playlists").select("*", { count: "exact", head: true })

      // Fetch total songs in library
      const { count: songsInLibrary } = await supabase
        .from("playlist_entries")
        .select("*", { count: "exact", head: true })

      // Fetch playlists created this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: playlistsThisWeek } = await supabase
        .from("playlists")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString())

      // Fetch songs added this month
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: songsThisMonth } = await supabase
        .from("playlist_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString())

      // Fetch uploads today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: uploadsToday } = await supabase
        .from("playlist_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())

      // Calculate recent uploads (this week)
      const { count: recentUploads } = await supabase
        .from("playlist_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString())

      setStats({
        totalPlaylists: totalPlaylists || 0,
        songsInLibrary: songsInLibrary || 0,
        recentUploads: recentUploads || 0,
        playlistsThisWeek: playlistsThisWeek || 0,
        songsThisMonth: songsThisMonth || 0,
        uploadsToday: uploadsToday || 0,
      })

      // Fetch recent activity
      await fetchRecentActivity()
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Get recent playlists
      const { data: recentPlaylists } = await supabase
        .from("playlists")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(3)

      // Get recent uploads
      const { data: recentEntries } = await supabase
        .from("playlist_entries")
        .select("id, created_at, playlist_id")
        .order("created_at", { ascending: false })
        .limit(5)

      const activities: RecentActivity[] = []

      // Add playlist activities
      if (recentPlaylists) {
        recentPlaylists.forEach((playlist) => {
          activities.push({
            id: `playlist-${playlist.id}`,
            type: "playlist_created",
            description: `New playlist "${playlist.name}" created`,
            timestamp: playlist.created_at,
          })
        })
      }

      // Add upload activities (group by day)
      if (recentEntries) {
        const uploadsByDay = recentEntries.reduce(
          (acc, entry) => {
            const date = new Date(entry.created_at).toDateString()
            acc[date] = (acc[date] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        Object.entries(uploadsByDay).forEach(([date, count]) => {
          activities.push({
            id: `upload-${date}`,
            type: "songs_uploaded",
            description: `${count} new songs uploaded to library`,
            timestamp: new Date(date).toISOString(),
          })
        })
      }

      // Sort by timestamp and take the most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 6))
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "playlist_created":
        return <Music className="h-4 w-4 text-blue-500" />
      case "songs_uploaded":
        return <Upload className="h-4 w-4 text-green-500" />
      case "playlist_updated":
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Loading data...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
            <p className="text-xs text-muted-foreground">
              Active playlists
              {stats.playlistsThisWeek > 0 && (
                <span className="text-green-600 ml-1">+{stats.playlistsThisWeek} this week</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Songs in Library</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.songsInLibrary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total tracks
              {stats.songsThisMonth > 0 && (
                <span className="text-green-600 ml-1">+{stats.songsThisMonth} this month</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUploads}</div>
            <p className="text-xs text-muted-foreground">
              This week
              {stats.uploadsToday > 0 && <span className="text-green-600 ml-1">+{stats.uploadsToday} today</span>}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/playlists">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-lg bg-blue-500 p-3 mb-4">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Create New Playlist</h3>
                <p className="text-sm text-muted-foreground text-center">Start building a new playlist for your show</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload-data">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-lg bg-green-500 p-3 mb-4">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Upload Music</h3>
                <p className="text-sm text-muted-foreground text-center">Add new tracks to your library</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/library">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-lg bg-purple-500 p-3 mb-4">
                  <Library className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Browse Library</h3>
                <p className="text-sm text-muted-foreground text-center">Explore your music collection</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-lg bg-orange-500 p-3 mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-muted-foreground text-center">Configure your dashboard preferences</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Your latest actions and updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
