"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Music,
  Library,
  Calendar,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Mr. Mig",
    email: "mig@kidcommand.com",
    avatar: "/placeholder-user.jpg",
  },
  teams: [
    {
      name: "Kid Command",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Music Matrix",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Acme Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Library",
      url: "/library",
      icon: Library,
      items: [
        {
          title: "All Songs",
          url: "/library",
        },
        {
          title: "Upload Data",
          url: "/library#upload",
        },
      ],
    },
    {
      title: "Playlists",
      url: "/playlists",
      icon: Music,
      items: [
        {
          title: "All Playlists",
          url: "/playlists",
        },
        {
          title: "Create New",
          url: "/playlists/new",
        },
      ],
    },
    {
      title: "Scheduling",
      url: "/scheduling",
      icon: Calendar,
      items: [
        {
          title: "View Schedules",
          url: "/scheduling",
        },
        {
          title: "Create Schedule",
          url: "/scheduling/new",
        },
      ],
    },
    {
      title: "AI Assistant",
      url: "/ai-assistant",
      icon: Bot,
      items: [
        {
          title: "Chat Assistant",
          url: "/ai-assistant",
        },
        {
          title: "Voice Assistant",
          url: "/ai-assistant/voice",
        },
        {
          title: "Brain Hub",
          url: "/ai-assistant/brain",
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Upload Data",
          url: "/upload-data",
        },
        {
          title: "Prompt Builder",
          url: "/prompt-builder",
        },
        {
          title: "Entries Editor",
          url: "/entries-editor",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r"
    >
      <SidebarHeader className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
