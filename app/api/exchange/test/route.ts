import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)

    // Test connection by getting organization info
    const response = await fetch("https://graph.microsoft.com/v1.0/organization", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Graph API test error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })

      return NextResponse.json({ error: `Connection test failed: ${response.statusText}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Exchange Online connection successful",
      organizationInfo: {
        displayName: data.value?.[0]?.displayName,
        id: data.value?.[0]?.id,
        verifiedDomains: data.value?.[0]?.verifiedDomains?.map((domain: any) => domain.name),
      },
    })
  } catch (error) {
    console.error("Error testing Exchange Online connection:", error)
    return NextResponse.json(
      { error: `Connection test failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
