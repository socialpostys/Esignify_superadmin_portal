import { createClient } from "@supabase/supabase-js"
import { createMockSupabaseClient } from "./mock-supabase"

// Initialize Supabase client
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a real or mock Supabase client based on environment
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createMockSupabaseClient()

// Log which client we're using
console.log(`Using ${supabaseUrl && supabaseAnonKey ? "real" : "mock"} Supabase client`)
