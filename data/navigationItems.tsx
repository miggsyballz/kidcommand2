import { AudioWaveform, Bot, Command, Settings2, SquareTerminal } from "lucide-react"

export const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquareTerminal,
  },
  {
    title: "Library",
    url: "/library",
    icon: AudioWaveform,
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: Command,
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Bot,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
  },
]
