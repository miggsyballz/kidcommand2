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
    </div>
  )
}
