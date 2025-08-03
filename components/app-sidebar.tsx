import { LayoutDashboard, Music, ListMusic, Settings } from "icons"
import Sidebar from "./Sidebar"

const AppSidebar = () => {
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Library",
      url: "/library",
      icon: Music,
    },
    {
      title: "Scheduling",
      url: "/playlists",
      icon: ListMusic,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ]

  return <Sidebar navItems={navMain} />
}

export default AppSidebar
