"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Camera, MapPin, Mail, Phone, Calendar, Radio, Save, Eye, EyeOff } from "lucide-react"

export default function AccountPage() {
  const [profileData, setProfileData] = useState({
    name: "Kid Kelly",
    username: "kidkelly",
    email: "kid.kelly@radiostation.com",
    phone: "+1 (555) 123-4567",
    location: "Los Angeles, CA",
    station: "KXXX 101.5 FM",
    role: "Radio Program Director",
    bio: "Veteran radio programmer with 20+ years of experience in music curation and broadcast programming. Specializing in contemporary hits and audience engagement strategies.",
    joinDate: "January 2020",
  })

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profileImage, setProfileImage] = useState("/placeholder.svg?height=100&width=100")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSecurityUpdate = (field: string, value: string) => {
    setSecurityData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    // TODO: Save profile data to backend
    console.log("Saving profile:", profileData)
  }

  const handleChangePassword = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("New passwords don't match!")
      return
    }
    // TODO: Change password in backend
    console.log("Changing password")
    setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="space-y-8">
      <div className="retro-particles"></div>

      <div>
        <h1 className="text-3xl font-bold neon-text">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="retro-card">
          <CardHeader>
            <CardTitle className="neon-text">Profile Information</CardTitle>
            <CardDescription>Update your personal information and radio station details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 retro-glow">
                <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="text-lg">KK</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button onClick={handlePhotoUpload} variant="outline" size="sm" className="retro-button bg-transparent">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max 2MB)</p>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleProfileUpdate("name", e.target.value)}
                    className="retro-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => handleProfileUpdate("username", e.target.value)}
                    className="retro-button"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileUpdate("email", e.target.value)}
                    className="pl-10 retro-button"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                    className="pl-10 retro-button"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => handleProfileUpdate("location", e.target.value)}
                    className="pl-10 retro-button"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Details</h3>

              <div className="space-y-2">
                <Label htmlFor="station">Radio Station</Label>
                <div className="relative">
                  <Radio className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="station"
                    value={profileData.station}
                    onChange={(e) => handleProfileUpdate("station", e.target.value)}
                    className="pl-10 retro-button"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profileData.role}
                  onChange={(e) => handleProfileUpdate("role", e.target.value)}
                  className="retro-button"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                  rows={4}
                  className="retro-button"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="w-full retro-button">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Account Security & Status */}
        <div className="space-y-8">
          {/* Account Status */}
          <Card className="retro-card">
            <CardHeader>
              <CardTitle className="neon-text">Account Status</CardTitle>
              <CardDescription>Your account information and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Status</span>
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member Since</span>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {profileData.joinDate}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role</span>
                <Badge variant="secondary">{profileData.role}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Station</span>
                <span className="text-sm text-muted-foreground">{profileData.station}</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="retro-card">
            <CardHeader>
              <CardTitle className="neon-text">Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={securityData.currentPassword}
                    onChange={(e) => handleSecurityUpdate("currentPassword", e.target.value)}
                    className="retro-button pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={securityData.newPassword}
                    onChange={(e) => handleSecurityUpdate("newPassword", e.target.value)}
                    className="retro-button pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={securityData.confirmPassword}
                    onChange={(e) => handleSecurityUpdate("confirmPassword", e.target.value)}
                    className="retro-button pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleChangePassword} className="w-full retro-button">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
