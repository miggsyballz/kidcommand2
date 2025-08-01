"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Brain,
  Settings,
  BookOpen,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
} from "lucide-react"
import { ScheduleGenerator } from "./schedule-generator"

interface KnowledgeEntry {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  "MusicMaster",
  "Radio Programming",
  "Scheduling",
  "Library Management",
  "Automation",
  "Reporting",
  "Best Practices",
  "Troubleshooting",
  "Other",
]

const DEFAULT_SYSTEM_PROMPT = `You are Kid Command AI, a specialized radio programming assistant focused on MusicMaster software and radio station operations. You help radio programmers, music directors, and station managers with:

- MusicMaster software expertise (scheduling, library management, reporting)
- Radio programming strategies (playlist creation, rotation management, daypart programming)
- Music library organization and data management
- Import/export procedures and CSV handling
- Radio automation and workflow optimization
- Industry best practices for radio programming
- Natural language show scheduling and playlist generation

You provide practical, actionable advice with specific steps and examples. Always be professional, knowledgeable, and focused on radio programming solutions.

Context: You are assisting with radio programming and MusicMaster software questions.`

export function BrainContent() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({
    title: "",
    category: "Other",
    content: "",
    tags: "",
  })
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    loadKnowledgeEntries()
  }, [])

  const loadKnowledgeEntries = () => {
    // Load from localStorage for now
    const stored = localStorage.getItem("brain-knowledge")
    if (stored) {
      try {
        setKnowledgeEntries(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load knowledge entries:", e)
      }
    }
  }

  const saveKnowledgeEntries = (entries: KnowledgeEntry[]) => {
    localStorage.setItem("brain-knowledge", JSON.stringify(entries))
    setKnowledgeEntries(entries)
  }

  const saveSystemPrompt = () => {
    localStorage.setItem("brain-system-prompt", systemPrompt)
    // TODO: Update the actual system prompt used by the AI
  }

  const resetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    localStorage.removeItem("brain-system-prompt")
  }

  const addKnowledgeEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return

    const entry: KnowledgeEntry = {
      id: Date.now().toString(),
      title: newEntry.title.trim(),
      category: newEntry.category,
      content: newEntry.content.trim(),
      tags: newEntry.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedEntries = [...knowledgeEntries, entry]
    saveKnowledgeEntries(updatedEntries)

    setNewEntry({ title: "", category: "Other", content: "", tags: "" })
    setShowNewEntry(false)
  }

  const updateKnowledgeEntry = (id: string, updates: Partial<KnowledgeEntry>) => {
    const updatedEntries = knowledgeEntries.map((entry) =>
      entry.id === id ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry,
    )
    saveKnowledgeEntries(updatedEntries)
  }

  const deleteKnowledgeEntry = (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) return

    const updatedEntries = knowledgeEntries.filter((entry) => entry.id !== id)
    saveKnowledgeEntries(updatedEntries)
  }

  const exportKnowledge = () => {
    const data = {
      systemPrompt,
      knowledgeEntries,
      exportedAt: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", "brain-knowledge-export.json")
    linkElement.click()
  }

  const importKnowledge = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.systemPrompt) {
          setSystemPrompt(data.systemPrompt)
        }

        if (data.knowledgeEntries && Array.isArray(data.knowledgeEntries)) {
          saveKnowledgeEntries(data.knowledgeEntries)
        }

        alert("Knowledge base imported successfully!")
      } catch (error) {
        alert("Failed to import knowledge base. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  const filteredEntries = knowledgeEntries.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "All" || entry.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    // Load system prompt from localStorage
    const storedPrompt = localStorage.getItem("brain-system-prompt")
    if (storedPrompt) {
      setSystemPrompt(storedPrompt)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8" />
          THE BRAIN
        </h1>
        <p className="text-muted-foreground">
          Configure AI behavior, manage knowledge base, and generate show schedules
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Show Scheduler
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Prompt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={saveSystemPrompt}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={resetSystemPrompt} variant="outline">
                  Reset to Default
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The system prompt defines how the AI assistant behaves and responds. Changes will take effect for new
                  conversations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          {/* Knowledge Base Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Knowledge Base ({knowledgeEntries.length} entries)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importKnowledge}
                    className="hidden"
                    id="import-knowledge"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("import-knowledge")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={exportKnowledge} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setShowNewEntry(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search knowledge entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Entry Form */}
              {showNewEntry && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Knowledge Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-title">Title</Label>
                        <Input
                          id="new-title"
                          value={newEntry.title}
                          onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                          placeholder="Entry title..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-category">Category</Label>
                        <Select
                          value={newEntry.category}
                          onValueChange={(value) => setNewEntry({ ...newEntry, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-content">Content</Label>
                      <Textarea
                        id="new-content"
                        value={newEntry.content}
                        onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                        placeholder="Knowledge content..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-tags">Tags (comma-separated)</Label>
                      <Input
                        id="new-tags"
                        value={newEntry.tags}
                        onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button onClick={addKnowledgeEntry}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Entry
                      </Button>
                      <Button onClick={() => setShowNewEntry(false)} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Knowledge Entries */}
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No knowledge entries found.</p>
                    <p className="text-sm">Add some entries to build your knowledge base!</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{entry.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{entry.category}</Badge>
                              {entry.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingEntry(editingEntry === entry.id ? null : entry.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteKnowledgeEntry(entry.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingEntry === entry.id ? (
                          <div className="space-y-4">
                            <Textarea
                              value={entry.content}
                              onChange={(e) => updateKnowledgeEntry(entry.id, { content: e.target.value })}
                              rows={6}
                            />
                            <Button onClick={() => setEditingEntry(null)} size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Done Editing
                            </Button>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">{entry.content}</div>
                        )}

                        <div className="mt-4 text-xs text-muted-foreground">
                          Created: {new Date(entry.created_at).toLocaleDateString()} • Updated:{" "}
                          {new Date(entry.updated_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Show Scheduler Tab */}
        <TabsContent value="scheduler">
          <ScheduleGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
