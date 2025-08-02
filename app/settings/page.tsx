"use client"

import React from "react"
import { useState } from "react"
import { SettingsContent } from "@/components/settings-content"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: "Kid Kelly",
    username: "kidkelly",
    email: "kid.kelly@radiostation.com",
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    weeklyDigest: true,
    playlistUpdates: true,
    newSongAlerts: false,
  })

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for demo
      localStorage.setItem("user-profile-data", JSON.stringify(profileData))

      setFeedback({ type: "success", message: "Profile settings saved successfully!" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to save profile settings. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationsSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Save to localStorage for demo
      localStorage.setItem("user-notifications", JSON.stringify(notifications))

      setFeedback({ type: "success", message: "Notification settings saved successfully!" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to save notification settings. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setFeedback({ type: "error", message: "Please fill in all password fields." })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters long." })
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFeedback({ type: "success", message: "Password updated successfully!" })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to update password. Please try again." })
    } finally {
      setIsLoading(false)
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
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your Music Matrix preferences</p>
        </div>
        <SettingsContent />
      </div>
    </DashboardLayout>
  )
}
