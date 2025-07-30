import { List, Upload, Brain, Settings } from "lucide-react"

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Kid Command</h1>
        <p className="text-muted-foreground">
          Your music production dashboard. Manage playlists, upload data, and build prompts with AI.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground">Total Playlists</h3>
          <p className="text-2xl font-bold text-card-foreground">12</p>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground">Total Tracks</h3>
          <p className="text-2xl font-bold text-card-foreground">248</p>
          <p className="text-xs text-muted-foreground">+15 from last week</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground">AI Generated</h3>
          <p className="text-2xl font-bold text-card-foreground">34</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
            <List className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
            <Upload className="w-5 h-5" />
            <span>Upload Data</span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
            <Brain className="w-5 h-5" />
            <span>AI Prompt</span>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
