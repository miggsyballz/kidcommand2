"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, User, Bell, Shield, Palette, Database } from "lucide-react"
import { BrainContent } from "./brain-content"

interface Settings {
  name: string
  email: string
  company: string
  bio: string
  notifications: {
    email: boolean
    push: boolean
    updates: boolean
  }
  privacy: {
    analytics: boolean
    marketing: boolean
    dataSharing: boolean
  }
  appearance: {
    theme: "light" | "dark" | "system"
    compactMode: boolean
    animations: boolean
  }
}

const defaultSettings: Settings = {
  name: "",
  email: "",
  company: "",
  bio: "",
  notifications: {
    email: true,
    push: false,
    updates: true,
  },
  privacy: {
    analytics: true,
    marketing: false,
    dataSharing: false,
  },
  appearance: {
    theme: "system",
    compactMode: false,
    animations: true,
  },
}

export function SettingsContent() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [activeTab, setActiveTab] = useState("profile")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kidcommand_settings")
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      setErrorMessage("Failed to load settings")
    }
  }, [])

  const handleSave = async () => {
    setSaveStatus("saving")
    setErrorMessage("")

    try {
      // Validate required fields
      if (!settings.name.trim()) {
        throw new Error("Name is required")
      }

      if (settings.email && !settings.email.includes("@")) {
        throw new Error("Please enter a valid email address")
      }

      // Save to localStorage with multiple keys for compatibility
      const settingsData = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem("kidcommand_settings", JSON.stringify(settingsData))
      localStorage.setItem("user_settings", JSON.stringify(settingsData))
      localStorage.setItem("settings", JSON.stringify(settingsData))

      // Also save just the name for easy access
      localStorage.setItem("user_name", settings.name)

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: settingsData,
        }),
      )

      setSaveStatus("success")

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle")
      }, 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to save settings")
      setSaveStatus("error")

      // Reset error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle")
        setErrorMessage("")
      }, 5000)
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev }
      const keys = path.split(".")
      let current: any = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "brain", label: "THE BRAIN", icon: Database },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Status Alerts */}
      {saveStatus === "success" && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage || "Failed to save settings. Please try again."}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => updateSettings("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSettings("email", e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={settings.company}
                    onChange={(e) => updateSettings("company", e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.bio}
                    onChange={(e) => updateSettings("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about updates and activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account and activities
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSettings("notifications.email", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get push notifications on your device</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateSettings("notifications.push", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">Stay informed about new features and improvements</p>
                  </div>
                  <Switch
                    checked={settings.notifications.updates}
                    onCheckedChange={(checked) => updateSettings("notifications.updates", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control how your data is used and shared</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">Help improve our service by sharing usage analytics</p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => updateSettings("privacy.analytics", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing emails and promotional content</p>
                  </div>
                  <Switch
                    checked={settings.privacy.marketing}
                    onCheckedChange={(checked) => updateSettings("privacy.marketing", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">Allow sharing anonymized data with partners</p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) => updateSettings("privacy.dataSharing", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    {["light", "dark", "system"].map((theme) => (
                      <Button
                        key={theme}
                        variant={settings.appearance.theme === theme ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSettings("appearance.theme", theme)}
                        className="capitalize"
                      >
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content</p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => updateSettings("appearance.compactMode", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable smooth animations and transitions</p>
                  </div>
                  <Switch
                    checked={settings.appearance.animations}
                    onCheckedChange={(checked) => updateSettings("appearance.animations", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "brain" && <BrainContent />}

          {/* Save Button */}
          {activeTab !== "brain" && (
            <div className="flex justify-end pt-6">
              <Button onClick={handleSave} disabled={saveStatus === "saving"} size="lg" className="min-w-32">
                {saveStatus === "saving" ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
