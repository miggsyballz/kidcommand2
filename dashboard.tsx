"use client"
import { GalleryVerticalEnd, Settings, Upload, PlayCircle } from "lucide-react"
import { useState } from "react"
import { PlaylistManagerContent } from "./components/PlaylistManagerContent"
import { UploadDataContent } from "./components/upload-data-content"
import { SettingsContent } from "./components/settings-content"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Navigation data
const data = {
  navMain: [
    {
      title: "Playlists",
      url: "#",
      icon: PlayCircle,
    },
    {
      title: "Upload Data",
      url: "#",
      icon: Upload,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ],
}

export default function Dashboard() {
  const [activePage, setActivePage] = useState("overview")

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#" className="flex items-center">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-sidebar-primary-foreground">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Kid Command</span>
                    <span className="text-xs">Dashboard</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => setActivePage(item.title.toLowerCase().replace(" ", "-"))}
                        className="flex items-center gap-2 w-full"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-sm font-medium">User</span>
                    <span className="text-xs text-muted-foreground">Account</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {activePage === "overview" && (
            <div className="min-h-[calc(100vh-8rem)] flex-1 rounded-xl bg-muted/50 p-8">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4">Welcome to Kid Command</h1>
                  <p className="text-muted-foreground text-lg">
                    Your dashboard is ready. Start by selecting a section from the sidebar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePage === "playlists" && <PlaylistManagerContent />}

          {activePage === "upload-data" && <UploadDataContent />}

          {activePage === "settings" && <SettingsContent />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
