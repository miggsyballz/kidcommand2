"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

interface EnvAnalysis {
  variable: string
  status: "present" | "missing" | "invalid"
  value?: string
  description: string
  required: boolean
}

export default function AnalyzeEnvUsage() {
  const [analysis, setAnalysis] = useState<EnvAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyzeEnvironment()
  }, [])

  const analyzeEnvironment = () => {
    const envVars: EnvAnalysis[] = [
      {
        variable: "NEXT_PUBLIC_SUPABASE_URL",
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : undefined,
        description: "Supabase project URL for database connection",
        required: true,
      },
      {
        variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing",
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : undefined,
        description: "Supabase anonymous key for client authentication",
        required: true,
      },
      {
        variable: "OPENAI_API_KEY",
        status: process.env.OPENAI_API_KEY ? "present" : "missing",
        value: process.env.OPENAI_API_KEY ? "Set" : undefined,
        description: "OpenAI API key for AI chat features",
        required: false,
      },
    ]

    // Validate Supabase URL format
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url.includes("supabase.co") || url.includes("your_") || url === "your_supabase_project_url") {
        envVars[0].status = "invalid"
      }
    }

    // Validate Supabase anon key format
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!key.startsWith("eyJ") || key.includes("your_") || key === "your_supabase_anon_key") {
        envVars[1].status = "invalid"
      }
    }

    // Validate OpenAI key format
    if (process.env.OPENAI_API_KEY) {
      const key = process.env.OPENAI_API_KEY
      if (!key.startsWith("sk-") || key.includes("your_")) {
        envVars[2].status = "invalid"
      }
    }

    setAnalysis(envVars)
    setLoading(false)
  }

  const getStatusIcon = (status: EnvAnalysis["status"]) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "missing":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "invalid":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: EnvAnalysis["status"]) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Valid
          </Badge>
        )
      case "missing":
        return <Badge variant="destructive">Missing</Badge>
      case "invalid":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Invalid
          </Badge>
        )
    }
  }

  const requiredMissing = analysis.filter((env) => env.required && env.status !== "present").length
  const optionalMissing = analysis.filter((env) => !env.required && env.status === "missing").length
  const invalidVars = analysis.filter((env) => env.status === "invalid").length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Analysis</CardTitle>
            <CardDescription>Analyzing environment variables...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Analysis</CardTitle>
          <CardDescription>Status of required and optional environment variables for Kid Command</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analysis.filter((env) => env.status === "present").length}
              </div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{requiredMissing}</div>
              <div className="text-sm text-muted-foreground">Required Missing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{invalidVars}</div>
              <div className="text-sm text-muted-foreground">Invalid</div>
            </div>
          </div>

          {/* Alerts */}
          {requiredMissing > 0 && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {requiredMissing} required environment variable{requiredMissing > 1 ? "s are" : " is"} missing. The
                application may not function properly.
              </AlertDescription>
            </Alert>
          )}

          {invalidVars > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {invalidVars} environment variable{invalidVars > 1 ? "s have" : " has"} invalid format. Please check the
                values.
              </AlertDescription>
            </Alert>
          )}

          {optionalMissing > 0 && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {optionalMissing} optional environment variable{optionalMissing > 1 ? "s are" : " is"} missing. Some
                features may be disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Environment Variables List */}
          <div className="space-y-4">
            {analysis.map((env) => (
              <div key={env.variable} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(env.status)}
                  <div>
                    <div className="font-medium">{env.variable}</div>
                    <div className="text-sm text-muted-foreground">{env.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {env.required && <Badge variant="outline">Required</Badge>}
                  {getStatusBadge(env.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Create a <code>.env.local</code> file in your project root
              </li>
              <li>Add your Supabase project URL and anon key from the Supabase dashboard</li>
              <li>Optionally add your OpenAI API key for AI features</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
