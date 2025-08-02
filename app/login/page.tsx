"use client"

import { useRouter } from "next/router"
import { useEffect } from "react"

const LoginPage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to splash screen
    router.push("/splash")
  }, [router])

  return (
    <div>
      <h1>Welcome to Music Matrix</h1>
      {/* Login form here */}
    </div>
  )
}

export default LoginPage
