import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get("id")

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the script
    const { data: script, error } = await supabase
      .from("powershell_scripts")
      .select("*")
      .eq("id", scriptId)
      .eq("organization_id", session.organizationId)
      .single()

    if (error || !script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    // Return the script as a downloadable file
    return new NextResponse(script.script_content, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${script.rule_name.replace(/[^a-zA-Z0-9]/g, "_")}.ps1"`,
      },
    })
  } catch (error) {
    console.error("Error downloading PowerShell script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
