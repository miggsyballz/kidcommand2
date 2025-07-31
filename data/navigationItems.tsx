import { Radio, Music, Library, Upload, Settings } from "lucide-react"

export const navigationItems = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: <Radio className="h-4 w-4" />,
  },
  {
    key: "playlists",
    title: "Playlists",
    icon: <Music className="h-4 w-4" />,
  },
  {
    key: "library",
    title: "Library",
    icon: <Library className="h-4 w-4" />,
  },
  {
    key: "upload-data",
    title: "Upload Data",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    key: "settings",
    title: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
]
