import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, tenantId } = body

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)

    // Validate required parameters
    if (!command || !tenantId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Execute PowerShell command via Exchange Online REST API
    const exchangeEndpoint = `https://outlook.office365.com/powershell-liveid/`

    const response = await fetch(exchangeEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-AnchorMailbox": `UPN:admin@${tenantId}`,
      },
      body: JSON.stringify({
        CmdletInput: {
          CmdletName: command.split(" ")[0],
          Parameters: parseCommandParameters(command),
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Exchange PowerShell API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })

      return NextResponse.json(
        { error: `Exchange PowerShell API error: ${response.statusText}` },
        { status: response.status },
      )
    }

    const result = await response.json()

    // Extract rule ID from result if it's a New-TransportRule command
    let ruleId = null
    if (command.startsWith("New-TransportRule") && result.value && result.value.length > 0) {
      ruleId = result.value[0].Identity || result.value[0].Guid
    }

    return NextResponse.json({
      success: true,
      result: result.value,
      ruleId,
    })
  } catch (error) {
    console.error("Error executing PowerShell command:", error)
    return NextResponse.json(
      { error: `Failed to execute PowerShell command: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Helper function to parse PowerShell command parameters
function parseCommandParameters(command: string): Record<string, any> {
  const parameters: Record<string, any> = {}

  // Simple parameter parsing - in production, use a more robust parser
  const paramRegex = /-(\w+)\s+"([^"]+)"/g
  let match

  while ((match = paramRegex.exec(command)) !== null) {
    const paramName = match[1]
    const paramValue = match[2]

    // Handle array parameters
    if (paramValue.startsWith("@(") && paramValue.endsWith(")")) {
      const arrayContent = paramValue.slice(2, -1)
      parameters[paramName] = arrayContent.split('","').map((item) => item.replace(/"/g, ""))
    } else {
      parameters[paramName] = paramValue
    }
  }

  return parameters
}
