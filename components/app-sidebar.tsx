"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  LogOut,
  PanelLeft,
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
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Music Matrix</span>
                <span className="truncate text-xs">Scheduling Interface</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className={`flex items-center p-2 ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}>
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
