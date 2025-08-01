"use client"

import type * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavMain } from "@/components/nav-main"
import { UserActions } from "@/components/user-actions"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <UserActions />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
