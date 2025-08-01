"use client"

import type React from "react"
import { useState } from "react"
import { GalleryVerticalEnd, Terminal, Music, Library, Settings, MessageCircle, X, Bot } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import { UserActions } from "@/components/user-actions"
import { AIAssistantChat } from "@/components/AIAssistantChat"
import { PlaylistManagerContent } from "@/components/PlaylistManagerContent"
import { LibraryContent } from "@/components/LibraryContent"
import { SettingsContent } from "@/components/settings-content"

const data = {
  teams: [
    {
      name: "Kid Command",
      logo: GalleryVerticalEnd,
      plan: "Radio Station",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      key: "dashboard",
      icon: Terminal,
    },
    {
      title: "Playlists",
      key: "playlists",
      icon: Music,
    },
    {
      title: "Library",
      key: "library",
      icon: Library,
    },
    {
      title: "Settings",
      key: "settings",
      icon: Settings,
    },
  ],
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState("dashboard")
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleNavClick = (key: string) => {
    setActiveView(key)
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return children
      case "playlists":
        return <PlaylistManagerContent />
      case "library":
        return <LibraryContent />
      case "settings":
        return <SettingsContent />
      default:
        return children
    }
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher teams={data.teams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} activeView={activeView} onNavClick={handleNavClick} />
        </SidebarContent>
        <SidebarFooter>
          <UserActions />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Image src="/kidcommand_logo.png" alt="Kid Command" width={32} height={32} className="rounded" />
            <h1 className="text-lg font-semibold">Kid Command</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderContent()}</div>
      </SidebarInset>

      {/* Floating AI Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* AI Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h2 className="font-semibold">AI Assistant</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIAssistantChat />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
