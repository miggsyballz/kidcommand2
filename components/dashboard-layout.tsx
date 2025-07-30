"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Music, Library, Upload, Settings, PlusCircle, Search, MoreHorizontal, Bot } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChatGPTInterface } from "@/components/chatgpt-interface"
import Image from "next/image"

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: string
}

export function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigationItems = [
    {
      id: "playlists",
      label: "Playlists",
      icon: Music,
      href: "/playlists",
      badge: null,
    },
    {
      id: "library",
      label: "Library",
      icon: Library,
      href: "/library",
      badge: null,
    },
    {
      id: "upload-data",
      label: "Upload Data",
      icon: Upload,
      href: "/upload-data",
      badge: null,
    },
    {
      id: "ai-assistant",
      label: "AI Assistant",
      icon: Bot,
      href: "/ai-assistant",
      badge: "New",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
      badge: null,
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-16" : "w-64"} border-r bg-muted/10 transition-all duration-300`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-4">
            <div className="flex items-center gap-2">
              <Image src="/kidcommand_logo.png" alt="Kid Command" width={32} height={32} className="rounded-lg" />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold">Kid Command</h1>
                  <p className="text-xs text-muted-foreground">Music Dashboard</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${sidebarCollapsed ? "px-2" : "px-3"}`}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="h-4 w-4" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="ml-2">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </a>
                  </Button>
                )
              })}
            </div>

            <Separator className="my-4" />

            {/* Quick Actions */}
            {!sidebarCollapsed && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-3">Quick Actions</h4>
                <Button variant="ghost" size="sm" className="w-full justify-start px-3">
                  <PlusCircle className="h-4 w-4" />
                  <span className="ml-2">New Playlist</span>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start px-3">
                  <Search className="h-4 w-4" />
                  <span className="ml-2">Search Library</span>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start px-3">
                  <Upload className="h-4 w-4" />
                  <span className="ml-2">Upload Music</span>
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="text-xs text-muted-foreground">
                  <p>MaxxBeats.com</p>
                  <p>Music Producer Dashboard</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ChatGPT Interface at Top */}
        <ChatGPTInterface />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

// Named export alias for compatibility
export const DashboardLayoutWrapper = DashboardLayout
