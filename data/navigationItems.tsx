import { AudioWaveform, Bot, Command, Settings2, SquareTerminal } from "lucide-react"

export const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "Overview",
        url: "/dashboard",
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
      },
    ],
  },
  {
    title: "Library",
    url: "/library",
    icon: AudioWaveform,
    items: [
      {
        title: "Browse Music",
        url: "/library",
      },
      {
        title: "Upload Songs",
        url: "/library/upload",
      },
    ],
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: Command,
    items: [
      {
        title: "All Playlists",
        url: "/playlists",
      },
      {
        title: "Create New",
        url: "/playlists/create",
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
        title: "Voice Commands",
        url: "/ai-assistant/voice",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/settings",
      },
      {
        title: "Account",
        url: "/settings/account",
      },
    ],
  },
]
