import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://bjiycbbursryclpngdcl.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqaXljYmJ1cnNyeWNscG5nZGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDQzOTcsImV4cCI6MjA2OTM4MDM5N30.X51Msg-rlzAG1Jvbo6yuy94hD0_cUZEMGsz84A3GC4k"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
