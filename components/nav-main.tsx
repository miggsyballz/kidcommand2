"use client"

import type { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  key: string
  icon?: LucideIcon
}

interface NavMainProps {
  items: NavItem[]
  activeView: string
  onNavClick: (key: string) => void
}

export function NavMain({ items, activeView, onNavClick }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeView === item.key}
              onClick={() => onNavClick(item.key)}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
