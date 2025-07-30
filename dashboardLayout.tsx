"use client"

import { BreadcrumbSeparator } from "@/components/ui/breadcrumb"

import type React from "react"
import { DashboardLayoutWrapper as DashboardLayoutWrapperComponent } from "@/components/dashboard-layout"
import DashboardCoordinator from "@/components/DashboardCoordinator"
import { navigationItems } from "@/data/navigationItems"
import GalleryVerticalEnd from "@/icons/GalleryVerticalEnd"
import ChatGPTInterface from "@/components/ChatGPTInterface"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui"
import { useState } from "react"

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  activeTab: string
}

function DashboardLayoutWrapper({ children, activeTab }: DashboardLayoutWrapperProps) {
  const [activePage, setActivePage] = useState(activeTab)

  const renderPageContent = () => {
    switch (activePage) {
      case "playlists":
        return <DashboardCoordinator activeView="playlists" />
      case "upload-data":
        return <DashboardCoordinator activeView="upload-data" />
      case "settings":
        return <DashboardCoordinator activeView="settings" />
      default:
        return (
          children || (
            <div className="min-h-[calc(100vh-8rem)] flex-1 rounded-xl bg-muted/50 p-8">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
                  <p className="text-muted-foreground text-lg">The requested page could not be found.</p>
                </div>
              </div>
            </div>
          )
        )
    }
  }

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.key === activePage)
    return currentItem?.title || "Kid Command"
  }

  return (
    <DashboardLayoutWrapperComponent>
      <SidebarProvider>
        <Sidebar className="sticky top-0 h-screen">
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
                      <span className="text-xs">Music Dashboard</span>
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
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={activePage === item.key}>
                        <button onClick={() => setActivePage(item.key)} className="flex items-center gap-2 w-full">
                          {item.icon}
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

        <SidebarInset className="flex-1">
          {/* ChatGPT Interface at the top */}
          <ChatGPTInterface />

          {/* Top Navbar */}
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Kid Command</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getCurrentPageTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* Main Content Area */}
          <main className="flex flex-1 flex-col gap-4 p-4">{renderPageContent()}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardLayoutWrapperComponent>
  )
}

export default DashboardLayoutWrapper
