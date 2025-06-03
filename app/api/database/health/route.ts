import { NextResponse } from "next/server"
import { checkDatabaseHealth, createMissingTables } from "@/lib/database-health"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    // Only allow super admins to check database health
    const session = await requireAuth("super_admin")

    const health = await checkDatabaseHealth()

    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        connected: false,
        tablesStatus: [],
        missingTables: [],
        errors: ["Authentication failed or database unreachable"],
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Only allow super admins to create missing tables
    const session = await requireAuth("super_admin")

    const result = await createMissingTables()

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 },
    )
  }
}
