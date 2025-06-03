import { NextResponse } from "next/server"
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Check environment variables first
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "..." || "Not set",
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: "Supabase environment variables are not properly configured",
        envCheck,
      })
    }

    // Test actual connection
    const supabase = createServerSupabaseClient()

    // Try to query system tables to test connection
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(10)

    if (error) {
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${error.message}`,
        envCheck,
        supabaseError: error,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      envCheck,
      tablesFound: data?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      envCheck: {
        NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    })
  }
}
