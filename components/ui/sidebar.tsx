"use client"

import { useSidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Library,
  ListMusic,
  Brain,
  Settings,
} from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/library", icon: Library },
  { label: "Playlists", href: "/playlists", icon: ListMusic },
  { label: "AI Assistant", href: "/ai", icon: Brain },
  { label: "Settings", href: "/settings", icon: Settings },
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 bg-background transition-all duration-300 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

function Sidebar() {
  const { state, toggleSidebar } = useSidebar()

  const collapsed = state === "collapsed"

  return (
    <aside
      className={clsx(
        "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[48px]" : "w-[220px]"
      )}
      data-state={state}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        {!collapsed && (
          <span className="text-lg font-semibold whitespace-nowrap">
            Music Matrix
          </span>
        )}
        <SidebarTrigger />
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={clsx(
              "flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
