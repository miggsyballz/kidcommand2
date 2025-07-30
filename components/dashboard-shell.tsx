"use client"

import Link from "next/link"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { Music, Upload, Settings, Library, Headphones, Zap, BarChart3 } from "lucide-react"
import Image from "next/image"
import { DashboardLayout } from "./dashboard-layout"

const navigation = [
  {
    name: "Playlists",
    href: "/playlists",
    icon: Music,
    description: "Manage your playlists",
  },
  {
    name: "Library",
    href: "/library",
    icon: Library,
    description: "Browse your music collection",
  },
  {
    name: "Upload Data",
    href: "/upload-data",
    icon: Upload,
    description: "Import music data",
  },
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Zap,
    description: "Voice & chat AI helper",
  },
  {
    name: "Prompt Builder",
    href: "/prompt-builder",
    icon: BarChart3,
    description: "AI-powered playlist generation",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App preferences",
  },
]

interface DashboardShellProps {
  children: ReactNode
  activeTab?: string
}

export function DashboardShell({ children, activeTab = "playlists" }: DashboardShellProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-8 w-8">
            <Image src="/kidcommand_logo.png" alt="Kid Command" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold">Kid Command</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Headphones className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Music Producer Dashboard</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  return <DashboardLayout activeTab={activeTab}>{children}</DashboardLayout>
}
