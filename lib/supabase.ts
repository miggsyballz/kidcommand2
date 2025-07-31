import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`)
}

// Validate anon key format (should be a JWT)
if (!supabaseAnonKey.startsWith("eyJ")) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format - should be a JWT token starting with "eyJ"')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: "public",
  },
})

// Helper function to handle database errors
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error)

  if (error?.code === "PGRST116") {
    return { error: "Table or view not found. Please check your database schema." }
  }

  if (error?.code === "42P01") {
    return { error: "Database table does not exist. Please run the setup scripts." }
  }

  if (error?.code === "23505") {
    return { error: "Duplicate entry. This record already exists." }
  }

  if (error?.code === "23503") {
    return { error: "Foreign key constraint violation. Referenced record does not exist." }
  }

  return { error: error?.message || `Failed to ${operation}` }
}

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("playlists").select("count(*)").limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: "Connection successful" }
  } catch (error) {
    return { success: false, error: "Failed to connect to database" }
  }
}
