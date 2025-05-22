import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Only allow admin login
    if (email !== "admin" || password !== "admin123") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Set session cookies for the super admin
    cookies().set("user_role", "super_admin", {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    // Use a fixed ID for the admin user
    cookies().set("user_id", "admin-user-id", {
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return NextResponse.json({ success: true, redirectTo: "/super-admin/dashboard" })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      { error: `Login failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
