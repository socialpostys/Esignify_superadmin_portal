import { NextResponse } from "next/server"
import { performSystemAudit, generateFixScript } from "@/lib/system-audit"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    // Only allow super admins to run system audit
    await requireAuth("super_admin")

    const audit = await performSystemAudit()

    return NextResponse.json({
      ...audit,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        overall: "critical",
        results: [
          {
            component: "System Access",
            status: "fail",
            message: error instanceof Error ? error.message : "Authentication failed",
          },
        ],
        summary: { passed: 0, failed: 1, warnings: 0 },
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    await requireAuth("super_admin")

    const audit = await performSystemAudit()
    const fixScript = await generateFixScript(audit.results)

    return NextResponse.json({
      fixScript,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate fix script" },
      { status: 500 },
    )
  }
}
