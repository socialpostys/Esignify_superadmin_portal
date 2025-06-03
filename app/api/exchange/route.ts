import { NextResponse } from "next/server"
import { createExchangeOnlineAPI } from "@/lib/exchange-online-api"
import { requireAuth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/error-handling"

export const POST = withErrorHandler(async (request: Request) => {
  // Require authentication
  const session = await requireAuth()

  if (!session.organizationId) {
    return NextResponse.json({ error: "No organization selected" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { action, config } = body

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 })
    }

    // Create Exchange Online API client
    const exchangeAPI = await createExchangeOnlineAPI(session.organizationId)

    if (!exchangeAPI) {
      return NextResponse.json({ error: "Exchange Online API not configured" }, { status: 400 })
    }

    // Handle different actions
    switch (action) {
      case "testConnection":
        const testResult = await exchangeAPI.testConnection()
        return NextResponse.json(testResult)

      case "deployRule":
        if (!config) {
          return NextResponse.json({ error: "Missing rule configuration" }, { status: 400 })
        }

        const deployResult = await exchangeAPI.deployTransportRule(config)
        return NextResponse.json(deployResult)

      case "getRules":
        const rules = await exchangeAPI.getTransportRules()
        return NextResponse.json({ rules })

      case "deleteRule":
        if (!body.ruleId) {
          return NextResponse.json({ error: "Missing rule ID" }, { status: 400 })
        }

        const deleteResult = await exchangeAPI.deleteTransportRule(body.ruleId)
        return NextResponse.json(deleteResult)

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in Exchange API route:", error)
    return NextResponse.json(
      { error: `API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
})
