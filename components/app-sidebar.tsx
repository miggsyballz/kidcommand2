"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  PanelLeft,
  LogOut,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

// This is sample data.
const data = {
  user: {
    name: "Mig",
    email: "mig@maxxbeats.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Music Matrix",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
    },
    {
      title: "Library",
      url: "/library",
      icon: BookOpen,
    },
    {
      title: "Playlists",
      url: "/playlists",
      icon: Bot,
    },
    {
      title: "AI Assistant",
      url: "/ai-assistant",
      icon: AudioWaveform,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, state } = useSidebar()

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    window.location.href = "/splash"
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="transition-[width] duration-300 ease-in-out" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/music-matrix-logo.png" alt="Music Matrix Logo" className="h-16 w-auto" />
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 ml-auto">
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center gap-2 p-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
