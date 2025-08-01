"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  Clock,
  Music,
  Play,
  Download,
  Save,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react"

interface ScheduleItem {
  id: string
  title: string
  artist: string
  duration: string
  durationSeconds: number
  startTime: string
  endTime: string
  type: "song" | "interstitial" | "break"
  notes?: string
}

interface GeneratedSchedule {
  title: string
  totalDuration: string
  totalDurationSeconds: number
  items: ScheduleItem[]
  breaks: Array<{
    afterTrack: number
    duration: string
    type: string
    notes: string
  }>
}

const QUICK_PROMPTS = [
  "Build a 3-hour morning show with high-energy rock music",
  "Create a 2-hour jazz evening show with commercial breaks every 20 minutes",
  "Generate a 1-hour workout playlist with fast-paced songs",
  "Build a 4-hour overnight show alternating between slow and fast songs",
  "Create a 90-minute drive-time show with news breaks every 15 minutes",
  "Generate a 2-hour classic hits show with station IDs every 30 minutes",
]

export function ScheduleGenerator() {
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState("")
  const [genre, setGenre] = useState("Any Genre")
  const [energy, setEnergy] = useState("Mixed Energy")
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ title: string; artist: string; duration: string; notes: string }>({
    title: "",
    artist: "",
    duration: "",
    notes: "",
  })

  const generateSchedule = async () => {
    if (!prompt.trim()) {
      setError("Please enter a scheduling request")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: { duration, genre, energy },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate schedule")
      }

      const data = await response.json()

      if (data.schedule) {
        setSchedule(data.schedule)
      } else {
        setError("No schedule was generated. Please try a different request.")
      }
    } catch (err) {
      console.error("Error generating schedule:", err)
      setError(err instanceof Error ? err.message : "Failed to generate schedule")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt)
  }

  const startEditing = (item: ScheduleItem) => {
    setEditingItem(item.id)
    setEditValues({
      title: item.title,
      artist: item.artist,
      duration: item.duration,
      notes: item.notes || "",
    })
  }

  const saveEdit = () => {
    if (!schedule || !editingItem) return

    const updatedItems = schedule.items.map((item) => {
      if (item.id === editingItem) {
        return {
          ...item,
          title: editValues.title,
          artist: editValues.artist,
          duration: editValues.duration,
          notes: editValues.notes,
        }
      }
      return item
    })

    setSchedule({
      ...schedule,
      items: updatedItems,
    })

    setEditingItem(null)
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditValues({ title: "", artist: "", duration: "", notes: "" })
  }

  const deleteItem = (itemId: string) => {
    if (!schedule) return

    const updatedItems = schedule.items.filter((item) => item.id !== itemId)
    setSchedule({
      ...schedule,
      items: updatedItems,
    })
  }

  const exportSchedule = () => {
    if (!schedule) return

    const dataStr = JSON.stringify(schedule, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${schedule.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_schedule.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const saveSchedule = async () => {
    // TODO: Implement save to database
    console.log("Saving schedule:", schedule)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Show Scheduler
        </h2>
        <p className="text-muted-foreground">Generate structured radio show schedules using natural language</p>
      </div>

      {/* Quick Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((quickPrompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2 px-3 bg-transparent"
                onClick={() => handleQuickPrompt(quickPrompt)}
              >
                <span className="text-xs">{quickPrompt}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Schedule Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your show schedule</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., Build a 3-hour morning show with high-energy rock music and commercial breaks every 20 minutes"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (optional)</Label>
              <Input
                id="duration"
                placeholder="e.g., 3:00:00"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre (optional)</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Any genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Genre">Any Genre</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy">Energy Level (optional)</Label>
              <Select value={energy} onValueChange={setEnergy}>
                <SelectTrigger>
                  <SelectValue placeholder="Mixed energy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mixed Energy">Mixed Energy</SelectItem>
                  <SelectItem value="high">High Energy</SelectItem>
                  <SelectItem value="medium">Medium Energy</SelectItem>
                  <SelectItem value="low">Low Energy</SelectItem>
                  <SelectItem value="alternating">Alternating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateSchedule} disabled={loading || !prompt.trim()} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Schedule */}
      {schedule && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {schedule.title}
                </CardTitle>
                <p className="text-muted-foreground">
                  Total Duration: {schedule.totalDuration} • {schedule.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={exportSchedule} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={saveSchedule} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Start</TableHead>
                    <TableHead className="w-20">End</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead className="w-20">Duration</TableHead>
                    <TableHead className="w-16">Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.startTime}</TableCell>
                      <TableCell className="font-mono text-xs">{item.endTime}</TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <Input
                            value={editValues.title}
                            onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <Input
                            value={editValues.artist}
                            onChange={(e) => setEditValues({ ...editValues, artist: e.target.value })}
                            className="h-8 text-sm"
                          />
                        ) : (
                          item.artist
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {editingItem === item.id ? (
                          <Input
                            value={editValues.duration}
                            onChange={(e) => setEditValues({ ...editValues, duration: e.target.value })}
                            className="h-8 text-sm w-16"
                            placeholder="MM:SS"
                          />
                        ) : (
                          item.duration
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.type === "song" ? "default" : item.type === "break" ? "destructive" : "secondary"
                          }
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <Input
                            value={editValues.notes}
                            onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Notes..."
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.notes}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingItem === item.id ? (
                            <>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => startEditing(item)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
