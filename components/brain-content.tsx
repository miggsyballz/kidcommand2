"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Brain,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Upload,
  Download,
  FileText,
  Database,
  Zap,
  MessageSquare,
  RefreshCw,
} from "lucide-react"

interface KnowledgeEntry {
  id: string
  command: string
  category: string
  instructions: string
  example?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ImportEntry {
  command: string
  category: string
  instructions: string
  example?: string
  tags: string[]
  isValid: boolean
  errors: string[]
}

const CATEGORIES = ["Sorting", "Playlist Management", "Interstitials", "Exporting", "General"]

export function BrainContent() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedEntries, setParsedEntries] = useState<ImportEntry[]>([])
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())

  const [formData, setFormData] = useState({
    command: "",
    category: "",
    instructions: "",
    example: "",
    tags: "",
  })

  const [formErrors, setFormErrors] = useState({
    command: "",
    category: "",
    instructions: "",
  })

  const [systemPrompt, setSystemPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalTokens: 0,
    avgResponseTime: 0,
  })

  useEffect(() => {
    loadBrainData()
  }, [])

  const loadBrainData = () => {
    try {
      const stored = localStorage.getItem("kidcommand_brain_prompt")
      if (stored) {
        setSystemPrompt(stored)
      } else {
        // Default system prompt
        setSystemPrompt(`You are Kid Kelly's AI assistant for Kid Command Radio Station. You help manage playlists, analyze music data, and provide insights about the radio station's music library.

Key responsibilities:
- Help create and manage playlists
- Analyze music trends and patterns
- Suggest songs based on criteria
- Provide radio programming insights
- Answer questions about the music library

Always be helpful, professional, and focused on radio station operations.`)
      }

      const savedTime = localStorage.getItem("kidcommand_brain_last_saved")
      if (savedTime) {
        setLastSaved(new Date(savedTime).toLocaleString())
      }

      // Load mock stats (in real app, these would come from API)
      setStats({
        totalConversations: 47,
        totalTokens: 12543,
        avgResponseTime: 1.2,
      })

      const savedEntries = localStorage.getItem("musicmaster-brain-entries")
      if (savedEntries) {
        try {
          setEntries(JSON.parse(savedEntries))
        } catch (error) {
          console.error("Error loading brain entries:", error)
        }
      }
    } catch (error) {
      console.error("Error loading brain data:", error)
    }
  }

  const saveBrainData = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem("kidcommand_brain_prompt", systemPrompt)
      localStorage.setItem("kidcommand_brain_last_saved", new Date().toISOString())

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setLastSaved(new Date().toLocaleString())
    } catch (error) {
      console.error("Error saving brain data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset to the default system prompt? This cannot be undone.")) {
      setSystemPrompt(`You are Kid Kelly's AI assistant for Kid Command Radio Station. You help manage playlists, analyze music data, and provide insights about the radio station's music library.

Key responsibilities:
- Help create and manage playlists
- Analyze music trends and patterns
- Suggest songs based on criteria
- Provide radio programming insights
- Answer questions about the music library

Always be helpful, professional, and focused on radio station operations.`)
    }
  }

  const validateForm = () => {
    const errors = {
      command: "",
      category: "",
      instructions: "",
    }

    if (!formData.command.trim()) {
      errors.command = "Command or Question is required"
    }

    if (!formData.category) {
      errors.category = "Category is required"
    }

    if (!formData.instructions.trim()) {
      errors.instructions = "Detailed Instructions or Answer is required"
    }

    setFormErrors(errors)
    return !Object.values(errors).some((error) => error !== "")
  }

  const resetForm = () => {
    setFormData({
      command: "",
      category: "",
      instructions: "",
      example: "",
      tags: "",
    })
    setFormErrors({
      command: "",
      category: "",
      instructions: "",
    })
    setEditingEntry(null)
    setIsFormOpen(false)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setFeedback({ type: "error", message: "Please fill in all required fields" })
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")

      if (editingEntry) {
        // Update existing entry
        const updatedEntry: KnowledgeEntry = {
          ...editingEntry,
          command: formData.command.trim(),
          category: formData.category,
          instructions: formData.instructions.trim(),
          example: formData.example.trim(),
          tags: tagsArray,
          updatedAt: now,
        }

        setEntries((prev) => prev.map((entry) => (entry.id === editingEntry.id ? updatedEntry : entry)))

        setFeedback({ type: "success", message: "Knowledge entry updated successfully!" })
      } else {
        // Create new entry
        const newEntry: KnowledgeEntry = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          command: formData.command.trim(),
          category: formData.category,
          instructions: formData.instructions.trim(),
          example: formData.example.trim(),
          tags: tagsArray,
          createdAt: now,
          updatedAt: now,
        }

        setEntries((prev) => [...prev, newEntry])
        setFeedback({ type: "success", message: "Knowledge entry added successfully!" })
      }

      resetForm()
    } catch (error) {
      console.error("Error saving entry:", error)
      setFeedback({ type: "error", message: "Failed to save entry. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry)
    setFormData({
      command: entry.command,
      category: entry.category,
      instructions: entry.instructions,
      example: entry.example || "",
      tags: entry.tags.join(", "),
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (entryId: string) => {
    try {
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
      setFeedback({ type: "success", message: "Knowledge entry deleted successfully!" })
    } catch (error) {
      console.error("Error deleting entry:", error)
      setFeedback({ type: "error", message: "Failed to delete entry. Please try again." })
    }
  }

  // Export functionality
  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      entries: entries,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `musicmaster-brain-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setFeedback({ type: "success", message: "Knowledge base exported successfully!" })
  }

  // Parse CSV data
  const parseCSV = (csvText: string): ImportEntry[] => {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const entries: ImportEntry[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const entry: ImportEntry = {
        command: "",
        category: "",
        instructions: "",
        example: "",
        tags: [],
        isValid: true,
        errors: [],
      }

      // Map columns
      headers.forEach((header, index) => {
        const value = values[index] || ""
        if (header.includes("command") || header.includes("question")) {
          entry.command = value
        } else if (header.includes("category")) {
          entry.category = value
        } else if (header.includes("instruction") || header.includes("answer")) {
          entry.instructions = value
        } else if (header.includes("example")) {
          entry.example = value
        } else if (header.includes("tag")) {
          entry.tags = value
            .split(";")
            .map((t) => t.trim())
            .filter((t) => t !== "")
        }
      })

      // Validate entry
      if (!entry.command.trim()) {
        entry.errors.push("Command/Question is required")
        entry.isValid = false
      }
      if (!entry.category.trim()) {
        entry.errors.push("Category is required")
        entry.isValid = false
      }
      if (!entry.instructions.trim()) {
        entry.errors.push("Instructions/Answer is required")
        entry.isValid = false
      }
      if (entry.category && !CATEGORIES.includes(entry.category)) {
        entry.errors.push(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`)
        entry.isValid = false
      }

      entries.push(entry)
    }

    return entries
  }

  // Parse JSON data
  const parseJSON = (jsonText: string): ImportEntry[] => {
    try {
      let data
      const trimmed = jsonText.trim()

      // Try to parse the JSON
      data = JSON.parse(trimmed)

      // Handle different JSON structures
      let entriesArray: any[] = []

      if (Array.isArray(data)) {
        entriesArray = data
      } else if (data.entries && Array.isArray(data.entries)) {
        entriesArray = data.entries
      } else if (typeof data === "object" && data !== null) {
        // Single object, wrap in array
        entriesArray = [data]
      } else {
        throw new Error("JSON must be an array of entries or an object with an 'entries' array")
      }

      return entriesArray.map((item: any, index: number): ImportEntry => {
        const entry: ImportEntry = {
          command: String(item.command || item.question || item.Command || item.Question || "").trim(),
          category: String(item.category || item.Category || "").trim(),
          instructions: String(item.instructions || item.answer || item.Instructions || item.Answer || "").trim(),
          example: String(item.example || item.Example || "").trim(),
          tags: [],
          isValid: true,
          errors: [],
        }

        // Handle tags - support multiple formats
        if (Array.isArray(item.tags)) {
          entry.tags = item.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag !== "")
        } else if (item.tags && typeof item.tags === "string") {
          entry.tags = item.tags
            .split(/[,;|]/)
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag !== "")
        } else if (item.Tags) {
          if (Array.isArray(item.Tags)) {
            entry.tags = item.Tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag !== "")
          } else if (typeof item.Tags === "string") {
            entry.tags = item.Tags.split(/[,;|]/)
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag !== "")
          }
        }

        // Validate entry
        if (!entry.command) {
          entry.errors.push("Command/Question is required")
          entry.isValid = false
        }
        if (!entry.category) {
          entry.errors.push("Category is required")
          entry.isValid = false
        }
        if (!entry.instructions) {
          entry.errors.push("Instructions/Answer is required")
          entry.isValid = false
        }
        if (entry.category && !CATEGORIES.includes(entry.category)) {
          entry.errors.push(`Invalid category '${entry.category}'. Must be one of: ${CATEGORIES.join(", ")}`)
          entry.isValid = false
        }

        return entry
      })
    } catch (error) {
      console.error("JSON parsing error:", error)
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Process import data
  const processImportData = async () => {
    setIsProcessing(true)
    setFeedback(null) // Clear any previous feedback

    try {
      let parsed: ImportEntry[] = []

      if (importFile) {
        console.log("Processing file:", importFile.name)
        const text = await importFile.text()

        if (importFile.name.toLowerCase().endsWith(".csv")) {
          console.log("Parsing as CSV")
          parsed = parseCSV(text)
        } else if (importFile.name.toLowerCase().endsWith(".json")) {
          console.log("Parsing as JSON from file")
          parsed = parseJSON(text)
        } else {
          throw new Error("Unsupported file format. Please use .csv or .json files.")
        }
      } else if (importData.trim()) {
        console.log("Processing pasted data")
        const trimmed = importData.trim()

        // Try to detect format
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          console.log("Detected JSON format")
          parsed = parseJSON(trimmed)
        } else {
          console.log("Detected CSV format")
          parsed = parseCSV(trimmed)
        }
      } else {
        throw new Error("Please provide data to import either by pasting or uploading a file.")
      }

      console.log("Parsed entries:", parsed)
      setParsedEntries(parsed)

      // Auto-select valid entries
      const validIndices = parsed.map((_, index) => index).filter((index) => parsed[index].isValid)
      setSelectedEntries(new Set(validIndices))

      if (parsed.length === 0) {
        setFeedback({ type: "error", message: "No entries found in the provided data." })
      } else {
        const validCount = parsed.filter((e) => e.isValid).length
        const invalidCount = parsed.length - validCount
        setFeedback({
          type: "success",
          message: `Successfully parsed ${parsed.length} entries (${validCount} valid, ${invalidCount} invalid)`,
        })
      }
    } catch (error) {
      console.error("Processing error:", error)
      setFeedback({
        type: "error",
        message: `Failed to parse data: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      setParsedEntries([])
      setSelectedEntries(new Set())
    } finally {
      setIsProcessing(false)
    }
  }

  // Confirm import
  const confirmImport = () => {
    const selectedParsedEntries = Array.from(selectedEntries)
      .map((index) => parsedEntries[index])
      .filter((entry) => entry.isValid)

    if (selectedParsedEntries.length === 0) {
      setFeedback({ type: "error", message: "No valid entries selected for import" })
      return
    }

    const now = new Date().toISOString()
    const newEntries: KnowledgeEntry[] = selectedParsedEntries.map((entry) => ({
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command: entry.command.trim(),
      category: entry.category,
      instructions: entry.instructions.trim(),
      example: entry.example?.trim() || "",
      tags: entry.tags,
      createdAt: now,
      updatedAt: now,
    }))

    if (importMode === "replace") {
      setEntries(newEntries)
      setFeedback({
        type: "success",
        message: `Successfully replaced knowledge base with ${newEntries.length} entries!`,
      })
    } else {
      setEntries((prev) => [...prev, ...newEntries])
      setFeedback({ type: "success", message: `Successfully imported ${newEntries.length} new entries!` })
    }

    // Reset import state
    setIsImportOpen(false)
    setImportData("")
    setImportFile(null)
    setParsedEntries([])
    setSelectedEntries(new Set())
  }

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      entry.command.toLowerCase().includes(searchLower) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      entry.category.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <Card className="retro-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="neon-text flex items-center gap-2 text-2xl">THE BRAIN</CardTitle>
              <CardDescription>Configure your AI assistant's personality and knowledge base</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-cyan-500/10 border-cyan-500 text-cyan-600">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              THE BRAIN is the core intelligence that powers your AI assistant. Customize how it thinks, responds, and
              helps you manage your radio station.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Conversations</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalConversations}</div>
                <p className="text-xs text-muted-foreground">Total chats</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Tokens Used</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Processing power</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Response Time</span>
                </div>
                <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">Average speed</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-prompt" className="text-base font-medium">
                  System Prompt
                </Label>
                <p className="text-sm text-muted-foreground">
                  Define how your AI assistant behaves and what it knows about your radio station
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {systemPrompt.length} characters
                </Badge>
                {lastSaved && (
                  <Badge variant="secondary" className="text-xs">
                    Saved {lastSaved}
                  </Badge>
                )}
              </div>
            </div>

            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter your system prompt..."
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex items-center gap-2">
              <Button onClick={saveBrainData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Brain Configuration
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetToDefault}>
                Reset to Default
              </Button>
            </div>
          </div>

          <Alert className="bg-cyan-500/10 border-cyan-500 text-cyan-600">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Include specific information about your radio station, music preferences, and
              typical workflows to make your AI assistant more helpful and personalized.
            </AlertDescription>
          </Alert>

          {/* Feedback Alert */}
          {feedback && (
            <Alert className={feedback.type === "success" ? "border-green-500" : "border-red-500"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold">Knowledge Entries</h3>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" className="retro-button bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="retro-button bg-transparent">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Import Knowledge Base
                    </DialogTitle>
                    <DialogDescription>
                      Import knowledge entries from JSON, CSV, or Excel files. You can paste data directly or upload a
                      file.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Import Options */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="import-data">Paste JSON, CSV, or Excel data here</Label>
                        <Textarea
                          id="import-data"
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          placeholder="Paste your data here... JSON format: [{'command': '...', 'category': '...', 'instructions': '...'}] or CSV format with headers"
                          rows={6}
                          className="retro-button font-mono text-sm"
                        />
                      </div>

                      <div className="text-center">
                        <span className="text-sm text-muted-foreground">OR</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="import-file">Upload CSV or JSON file</Label>
                        <Input
                          id="import-file"
                          type="file"
                          accept=".csv,.json"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          className="retro-button"
                        />
                      </div>

                      <Button
                        onClick={processImportData}
                        disabled={isProcessing || (!importData.trim() && !importFile)}
                        className="retro-button w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {isProcessing ? "Processing..." : "Parse Data"}
                      </Button>
                    </div>

                    {/* Preview Table */}
                    {parsedEntries.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium">
                              Preview ({parsedEntries.filter((e) => e.isValid).length} valid,{" "}
                              {parsedEntries.filter((e) => !e.isValid).length} invalid)
                            </h4>
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={() => {
                                  const validIndices = parsedEntries
                                    .map((_, index) => index)
                                    .filter((index) => parsedEntries[index].isValid)
                                  setSelectedEntries(new Set(validIndices))
                                }}
                                size="sm"
                                variant="outline"
                                className="retro-button bg-transparent"
                              >
                                Select All Valid
                              </Button>
                              <Button
                                onClick={() => setSelectedEntries(new Set())}
                                size="sm"
                                variant="outline"
                                className="retro-button bg-transparent"
                              >
                                Clear Selection
                              </Button>
                            </div>
                          </div>

                          <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">Import</TableHead>
                                  <TableHead>Command</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Instructions</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parsedEntries.map((entry, index) => (
                                  <TableRow
                                    key={index}
                                    className={!entry.isValid ? "bg-red-50 dark:bg-red-950/20" : ""}
                                  >
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedEntries.has(index)}
                                        onCheckedChange={(checked) => {
                                          const newSelected = new Set(selectedEntries)
                                          if (checked) {
                                            newSelected.add(index)
                                          } else {
                                            newSelected.delete(index)
                                          }
                                          setSelectedEntries(newSelected)
                                        }}
                                        disabled={!entry.isValid}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium max-w-xs">
                                      <div className="truncate" title={entry.command}>
                                        {entry.command || <span className="text-muted-foreground italic">Missing</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {entry.category ? (
                                        <Badge
                                          variant={CATEGORIES.includes(entry.category) ? "secondary" : "destructive"}
                                        >
                                          {entry.category}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground italic">Missing</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                      <div className="truncate" title={entry.instructions}>
                                        {entry.instructions ? (
                                          entry.instructions.substring(0, 50) + "..."
                                        ) : (
                                          <span className="text-muted-foreground italic">Missing</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {entry.isValid ? (
                                        <Badge variant="default" className="bg-green-500">
                                          Valid
                                        </Badge>
                                      ) : (
                                        <div className="space-y-1">
                                          <Badge variant="destructive">Invalid</Badge>
                                          {entry.errors.map((error, errorIndex) => (
                                            <div key={errorIndex} className="text-xs text-red-500">
                                              {error}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Import Mode Selection */}
                          <div className="space-y-3">
                            <Label>Import Mode</Label>
                            <RadioGroup
                              value={importMode}
                              onValueChange={(value: "merge" | "replace") => setImportMode(value)}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="merge" id="merge" />
                                <Label htmlFor="merge">Merge with existing entries (recommended)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="replace" id="replace" />
                                <Label htmlFor="replace">Replace all existing entries (destructive)</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => setIsImportOpen(false)}
                      variant="outline"
                      className="retro-button bg-transparent"
                    >
                      Cancel
                    </Button>
                    {parsedEntries.length > 0 && (
                      <Button onClick={confirmImport} disabled={selectedEntries.size === 0} className="retro-button">
                        <Save className="h-4 w-4 mr-2" />
                        Import {selectedEntries.size} Entries
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={() => setIsFormOpen(true)} className="retro-button" disabled={isFormOpen}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Entry
              </Button>
            </div>
          </div>

          {/* Entry Form */}
          {isFormOpen && (
            <Card className="border-2 border-cyan-500/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingEntry ? "Edit Knowledge Entry" : "Add New Knowledge Entry"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="command">
                      Command or Question <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="command"
                      value={formData.command}
                      onChange={(e) => setFormData((prev) => ({ ...prev, command: e.target.value }))}
                      placeholder="e.g., How do I sort by artist?"
                      className={`retro-button ${formErrors.command ? "border-red-500" : ""}`}
                    />
                    {formErrors.command && <p className="text-sm text-red-500">{formErrors.command}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className={`retro-button ${formErrors.category ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">
                      Detailed Instructions or Answer <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Provide detailed step-by-step instructions or the complete answer..."
                      rows={4}
                      className={`retro-button ${formErrors.instructions ? "border-red-500" : ""}`}
                    />
                    {formErrors.instructions && <p className="text-sm text-red-500">{formErrors.instructions}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="example">Example Usage (Optional)</Label>
                    <Textarea
                      id="example"
                      value={formData.example}
                      onChange={(e) => setFormData((prev) => ({ ...prev, example: e.target.value }))}
                      placeholder="Provide an example of how to use this command or when this answer applies..."
                      rows={3}
                      className="retro-button"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., sort, artist, alphabetical, music"
                      className="retro-button"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="retro-button flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="retro-button bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Knowledge Entries</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by command, category, or tags..."
                className="pl-10 retro-button"
              />
            </div>
          </div>

          {/* Entries Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium">Existing Entries ({filteredEntries.length})</h4>
            </div>

            {filteredEntries.length === 0 ? (
              <Card className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Knowledge Entries Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "No entries match your search criteria."
                    : "Start building THE BRAIN by adding your first knowledge entry."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsFormOpen(true)} className="retro-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                )}
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Command / Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate" title={entry.command}>
                            {entry.command}
                          </div>
                          {entry.instructions && (
                            <div className="text-sm text-muted-foreground truncate mt-1" title={entry.instructions}>
                              {entry.instructions.substring(0, 100)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={() => handleEdit(entry)}
                              size="sm"
                              variant="outline"
                              className="retro-button"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="retro-button text-red-500 hover:text-red-700 bg-transparent"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this knowledge entry? This action cannot be undone.
                                    <br />
                                    <br />
                                    <strong>Command:</strong> {entry.command}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(entry.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
