import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutProps) {
  return <>{children}</>
}
