import { cookies } from "next/headers"
import { createServerSupabaseClient } from "./supabase-client"
import { v4 as uuidv4 } from "uuid"
import { redirect } from "next/navigation"

// Session duration in seconds (30 days)
const SESSION_DURATION = 60 * 60 * 24 * 30

export interface UserSession {
  id: string
  userId: string
  organizationId?: string
  role: "super_admin" | "org_admin" | "user"
  sessionToken: string
  expiresAt: Date
}

// Server-side authentication functions
export async function createSession(
  userId: string,
  role: "super_admin" | "org_admin" | "user",
  organizationId?: string,
) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate tokens
    const sessionToken = uuidv4()
    const refreshToken = uuidv4()
    const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000)

    // Create session in database
    const { error } = await supabase.from("user_sessions").insert({
      user_id: userId,
      organization_id: organizationId || null,
      role,
      session_token: sessionToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      last_accessed: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating session:", error)
      return { success: false, error: error.message }
    }

    // Set cookies
    const cookieStore = cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
      sameSite: "lax",
    })

    cookieStore.set("user_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION,
      path: "/",
      sameSite: "lax",
    })

    if (organizationId) {
      cookieStore.set("organization_id", organizationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_DURATION,
        path: "/",
        sameSite: "lax",
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating session:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating session",
    }
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = createServerSupabaseClient()

    // Get session from database
    const { data, error } = await supabase.from("user_sessions").select("*").eq("session_token", sessionToken).single()

    if (error || !data) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      await invalidateSession(sessionToken)
      return null
    }

    // Update last accessed time
    await supabase
      .from("user_sessions")
      .update({ last_accessed: new Date().toISOString() })
      .eq("session_token", sessionToken)

    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      role: data.role,
      sessionToken: data.session_token,
      expiresAt: new Date(data.expires_at),
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function invalidateSession(sessionToken: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete session from database
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)

    // Clear cookies
    const cookieStore = cookies()
    cookieStore.delete("session_token")
    cookieStore.delete("user_role")
    cookieStore.delete("organization_id")

    return { success: true }
  } catch (error) {
    console.error("Error invalidating session:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error invalidating session",
    }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (sessionToken) {
    await invalidateSession(sessionToken)
  }

  redirect("/")
}

// Authentication middleware - Updated to handle missing database gracefully
export async function requireAuth(requiredRole?: "super_admin" | "org_admin" | "user") {
  try {
    const session = await getSession()

    if (!session) {
      redirect("/")
    }

    if (
      requiredRole &&
      session.role !== requiredRole &&
      !(requiredRole === "org_admin" && session.role === "super_admin")
    ) {
      redirect("/")
    }

    return session
  } catch (error) {
    // If database is not available, allow super admin access for setup
    const cookieStore = cookies()
    const userRole = cookieStore.get("user_role")?.value

    if (userRole === "super_admin" && (!requiredRole || requiredRole === "super_admin")) {
      return {
        id: "temp-session",
        userId: "admin",
        role: "super_admin" as const,
        sessionToken: "temp-token",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      }
    }

    redirect("/")
  }
}
