"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { User, SettingsIcon, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface SettingsContentProps {
  onSave?: (settings: UserSettings) => void
}

interface UserSettings {
  name: string
  email: string
  defaultSortOrder: string
}

export function SettingsContent({ onSave }: SettingsContentProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    email: "",
    defaultSortOrder: "name",
  })

  const [isSaving, setIsSaving] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      if (onSave) {
        await onSave(settings)
      } else {
        // Simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log("Settings saved:", settings)
      }

      // Show success feedback (you could add a toast here)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* User Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Info
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={settings.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="sort-order">Default Playlist Sort Order</Label>
              <Select
                value={settings.defaultSortOrder}
                onValueChange={(value) => handleInputChange("defaultSortOrder", value)}
              >
                <SelectTrigger id="sort-order">
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="date-created">Date Created (Newest)</SelectItem>
                  <SelectItem value="date-created-desc">Date Created (Oldest)</SelectItem>
                  <SelectItem value="song-count">Song Count (Most)</SelectItem>
                  <SelectItem value="song-count-desc">Song Count (Least)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={handleThemeChange} />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
            {isSaving ? (
              <>
                <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
