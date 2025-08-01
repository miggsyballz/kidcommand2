"use client"

import { LogOut, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function UserActions() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    // Clear any auth tokens/session data
    localStorage.removeItem("auth-token")
    sessionStorage.clear()

    // Redirect to login
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Log out</span>
      </Button>
    </div>
  )
}
