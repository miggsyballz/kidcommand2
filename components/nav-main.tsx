"use client"

import type { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  activeView,
  onNavClick,
}: {
  items: {
    title: string
    key: string
    icon?: LucideIcon
  }[]
  activeView: string
  onNavClick: (key: string) => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = activeView === item.key
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => onNavClick(item.key)}
                className={`cursor-pointer ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
