import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ruleId = params.id

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)

    // Delete transport rule via Graph API
    const response = await fetch(`https://graph.microsoft.com/v1.0/admin/exchange/transportRules/${ruleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Graph API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })

      return NextResponse.json(
        { error: `Failed to delete transport rule: ${response.statusText}` },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, message: "Transport rule deleted successfully" })
  } catch (error) {
    console.error("Error deleting transport rule:", error)
    return NextResponse.json(
      { error: `Failed to delete transport rule: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
