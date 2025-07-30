"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Music, RefreshCw, Upload, ChevronDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibraryUploadContent } from "@/components/library-upload-content"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PlaylistEntry {
  id: string
  playlist_id?: string
  // Spreadsheet-style columns
  Catergory?: string
  UID?: string
  Title?: string
  Artist?: string
  Keywords?: string
  Runs?: string
  Performnce?: number
  Era?: number
  Mood?: number
  Energy?: number
  Role?: string
  Sound?: string
  Tempo?: number
  Type?: string
  created_at: string
  updated_at?: string
  // Legacy columns for fallback
  title?: string
  artist?: string
  genre?: string
  // Playlist memberships (array of playlists this song is in)
  playlists?: Array<{ id: string; name: string }>
}

interface Playlist {
  id: string
  name: string
}

interface SongPlaylistCount {
  [songKey: string]: Array<{ id: string; name: string }>
}

export function LibraryContent() {
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [songPlaylistMap, setSongPlaylistMap] = useState<SongPlaylistCount>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [selectedPlaylist])

  const fetchData = async () => {
    await Promise.all([fetchPlaylists(), fetchEntries(), fetchSongPlaylistMemberships()])
  }

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase.from("playlists").select("id, name").order("name")

      if (error) throw error
      setPlaylists(data || [])
    } catch (err) {
      console.error("Error fetching playlists:", err)
    }
  }

  const fetchSongPlaylistMemberships = async () => {
    try {
      // Get all playlist entries with their playlist info
      const { data, error } = await supabase.from("playlist_entries").select(`
          Title,
          Artist,
          playlists!inner(id, name)
        `)

      if (error) throw error

      // Group by song (Title + Artist combination)
      const songMap: SongPlaylistCount = {}

      data?.forEach((entry: any) => {
        const songKey = `${entry.Title || "Unknown"}-${entry.Artist || "Unknown"}`
        if (!songMap[songKey]) {
          songMap[songKey] = []
        }

        // Add playlist if not already in the array
        const playlistExists = songMap[songKey].some((p) => p.id === entry.playlists.id)
        if (!playlistExists) {
          songMap[songKey].push({
            id: entry.playlists.id,
            name: entry.playlists.name,
          })
        }
      })

      setSongPlaylistMap(songMap)
    } catch (err) {
      console.error("Error fetching song playlist memberships:", err)
    }
  }

  const fetchEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("playlist_entries")
        .select(`
          *,
          playlists(name)
        `)
        .order("created_at", { ascending: false })

      if (selectedPlaylist !== "all") {
        query = query.eq("playlist_id", selectedPlaylist)
      }

      const { data, error } = await query

      if (error) throw error

      // Remove duplicates based on Title + Artist combination
      const uniqueEntries = new Map()

      data?.forEach((entry: any) => {
        const songKey = `${entry.Title || entry.title || "Unknown"}-${entry.Artist || entry.artist || "Unknown"}`

        // Only keep the first occurrence of each unique song
        if (!uniqueEntries.has(songKey)) {
          uniqueEntries.set(songKey, {
            ...entry,
            // Use spreadsheet columns first, fallback to legacy columns
            Title: entry.Title || entry.title || "",
            Artist: entry.Artist || entry.artist || "",
            Catergory: entry.Catergory || entry.genre || "",
          })
        }
      })

      setEntries(Array.from(uniqueEntries.values()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleDataUploaded = () => {
    // Refresh library after upload
    handleRefresh()
  }

  const getSongPlaylists = (title: string, artist: string) => {
    const songKey = `${title || "Unknown"}-${artist || "Unknown"}`
    return songPlaylistMap[songKey] || []
  }

  // Filter entries based on search term
  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      entry.Title?.toLowerCase().includes(searchLower) ||
      entry.Artist?.toLowerCase().includes(searchLower) ||
      entry.Catergory?.toLowerCase().includes(searchLower) ||
      entry.Keywords?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Library</h1>
          <p className="text-muted-foreground">Your complete music collection</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Library</h1>
          <p className="text-muted-foreground">Your complete music collection</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            Your complete music collection ({filteredEntries.length} unique songs)
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by title, artist, category, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Songs (Unique)</SelectItem>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                All Songs
                {selectedPlaylist !== "all" && (
                  <Badge variant="secondary" className="ml-2">
                    {playlists.find((p) => p.id === selectedPlaylist)?.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {entries.length === 0 ? "No songs in your library" : "No songs match your search"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {entries.length === 0
                      ? "Upload some music data to get started"
                      : "Try adjusting your search terms or playlist filter"}
                  </p>
                  {entries.length === 0 && (
                    <Button onClick={() => document.querySelector('[value="upload"]')?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Data
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="overflow-auto max-h-[70vh]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="min-w-[150px]">Playlists</TableHead>
                          <TableHead className="min-w-[120px]">Category</TableHead>
                          <TableHead className="min-w-[100px]">UID</TableHead>
                          <TableHead className="min-w-[150px]">Title</TableHead>
                          <TableHead className="min-w-[120px]">Artist</TableHead>
                          <TableHead className="min-w-[150px]">Keywords</TableHead>
                          <TableHead className="min-w-[80px]">Runs</TableHead>
                          <TableHead className="min-w-[100px]">Performance</TableHead>
                          <TableHead className="min-w-[80px]">Era</TableHead>
                          <TableHead className="min-w-[80px]">Mood</TableHead>
                          <TableHead className="min-w-[80px]">Energy</TableHead>
                          <TableHead className="min-w-[100px]">Role</TableHead>
                          <TableHead className="min-w-[100px]">Sound</TableHead>
                          <TableHead className="min-w-[80px]">Tempo</TableHead>
                          <TableHead className="min-w-[100px]">Type</TableHead>
                          <TableHead className="min-w-[100px]">Added</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry, index) => {
                          const songPlaylists = getSongPlaylists(entry.Title || "", entry.Artist || "")

                          return (
                            <TableRow key={entry.id} className="hover:bg-muted/30">
                              <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                              <TableCell className="text-xs">
                                {songPlaylists.length > 0 ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                                        {songPlaylists.length} playlist{songPlaylists.length !== 1 ? "s" : ""}
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {songPlaylists.map((playlist) => (
                                        <DropdownMenuItem key={playlist.id} className="text-xs">
                                          <Badge variant="outline" className="text-xs">
                                            {playlist.name}
                                          </Badge>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-muted-foreground text-xs">No playlists</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">{entry.Catergory || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.UID || "-"}</TableCell>
                              <TableCell className="text-xs font-medium">{entry.Title || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Artist || "-"}</TableCell>
                              <TableCell className="text-xs max-w-[150px] truncate" title={entry.Keywords || ""}>
                                {entry.Keywords || "-"}
                              </TableCell>
                              <TableCell className="text-xs">{entry.Runs || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Performnce || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Era || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Mood || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Energy || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Role || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Sound || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Tempo || "-"}</TableCell>
                              <TableCell className="text-xs">{entry.Type || "-"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <LibraryUploadContent onDataUploaded={handleDataUploaded} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Default export for backward compatibility
export default LibraryContent
