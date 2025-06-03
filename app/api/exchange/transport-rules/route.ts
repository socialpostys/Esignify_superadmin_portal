import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)

    // Get transport rules via Graph API
    const response = await fetch("https://graph.microsoft.com/v1.0/admin/exchange/transportRules", {
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
        { error: `Failed to retrieve transport rules: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data.value || [])
  } catch (error) {
    console.error("Error retrieving transport rules:", error)
    return NextResponse.json(
      { error: `Failed to retrieve transport rules: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
