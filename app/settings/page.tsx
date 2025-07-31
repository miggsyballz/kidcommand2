"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, User, Shield, Eye, EyeOff, Camera, AlertCircle, Brain } from "lucide-react"
import { BrainContent } from "@/components/brain-content"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Account settings state
  const [accountData, setAccountData] = useState({
    firstName: "Mig",
    lastName: "Producer",
    email: "mig@maxxbeats.com",
    phone: "+1 (555) 123-4567",
    bio: "Music producer and digital content creator specializing in beats and instrumentals.",
    website: "https://maxxbeats.com",
    location: "Los Angeles, CA",
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    weeklyDigest: true,
    darkMode: false,
    autoSave: true,
    compactView: false,
  })

  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleAccountSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for demo
      localStorage.setItem("user-account-data", JSON.stringify(accountData))

      setFeedback({ type: "success", message: "Account settings saved successfully!" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to save account settings. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for demo
      localStorage.setItem("user-preferences", JSON.stringify(preferences))

      // Apply dark mode immediately
      if (preferences.darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      setFeedback({ type: "success", message: "Preferences saved successfully!" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to save preferences. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecuritySave = async () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      setFeedback({ type: "error", message: "Please fill in all password fields." })
      return
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." })
      return
    }

    if (securityData.newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters long." })
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFeedback({ type: "success", message: "Password updated successfully!" })
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to update password. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        // In a real app, you'd upload to a server
        setFeedback({ type: "success", message: "Profile photo updated successfully!" })
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear feedback after 5 seconds
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold neon-text">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert className={feedback.type === "success" ? "border-green-500" : "border-red-500"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 retro-button">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="brain" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              THE BRAIN
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card className="retro-card">
              <CardHeader>
                <CardTitle className="neon-text">Account Information</CardTitle>
                <CardDescription>Update your account details and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder.svg?height=80&width=80" />
                    <AvatarFallback>MG</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button variant="outline" className="retro-button bg-transparent" asChild>
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-sm text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={accountData.firstName}
                        onChange={(e) => setAccountData((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="retro-button"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={accountData.lastName}
                        onChange={(e) => setAccountData((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="retro-button"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, email: e.target.value }))}
                      className="retro-button"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={accountData.phone}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="retro-button"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={accountData.website}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, website: e.target.value }))}
                      className="retro-button"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={accountData.location}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, location: e.target.value }))}
                      className="retro-button"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={accountData.bio}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="retro-button"
                    />
                  </div>
                </div>

                <Button onClick={handleAccountSave} disabled={isLoading} className="retro-button w-full">
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="retro-card">
              <CardHeader>
                <CardTitle className="neon-text">Preferences</CardTitle>
                <CardDescription>Customize your app experience and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for important updates
                        </p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                      </div>
                      <Switch
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about new features and promotions
                        </p>
                      </div>
                      <Switch
                        checked={preferences.marketingEmails}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, marketingEmails: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">Get a weekly summary of your activity</p>
                      </div>
                      <Switch
                        checked={preferences.weeklyDigest}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, weeklyDigest: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* App Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">App Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                      </div>
                      <Switch
                        checked={preferences.darkMode}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, darkMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Save</Label>
                        <p className="text-sm text-muted-foreground">Automatically save your work as you type</p>
                      </div>
                      <Switch
                        checked={preferences.autoSave}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, autoSave: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact View</Label>
                        <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content</p>
                      </div>
                      <Switch
                        checked={preferences.compactView}
                        onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, compactView: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handlePreferencesSave} disabled={isLoading} className="retro-button w-full">
                  {isLoading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="retro-card">
              <CardHeader>
                <CardTitle className="neon-text">Security Settings</CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="retro-button pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="retro-button pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="retro-button pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                  </div>
                </div>

                <Button onClick={handleSecuritySave} disabled={isLoading} className="retro-button w-full">
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* THE BRAIN Tab */}
          <TabsContent value="brain">
            <BrainContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
