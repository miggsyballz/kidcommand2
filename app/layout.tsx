import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardShell } from "@/components/dashboard-shell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kid Command - Music Dashboard",
  description: "Radio programming and music management dashboard",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthGuard>
            <DashboardShell>{children}</DashboardShell>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  )
}
