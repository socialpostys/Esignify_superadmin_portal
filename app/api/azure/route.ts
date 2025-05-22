import { type NextRequest, NextResponse } from "next/server"
import type { AzureSettings } from "@/lib/types"

// Azure AD Graph API endpoints
const GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, settings } = body

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 })
    }

    if (!settings) {
      return NextResponse.json({ error: "Missing settings parameter" }, { status: 400 })
    }

    switch (action) {
      case "getToken":
        return await getToken(settings)
      case "getUsers":
        return await getUsers(settings, body.pageSize || 100)
      case "getUsersNextPage":
        return await getUsersNextPage(settings, body.nextLink)
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in Azure API route:", error)
    return NextResponse.json(
      { error: `API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Function to get an access token for Microsoft Graph API
async function getToken(azureSettings: AzureSettings) {
  try {
    console.log("Getting Azure AD token with settings:", {
      tenant_id: azureSettings.tenant_id,
      client_id: azureSettings.client_id,
      // Don't log client secret for security reasons
    })

    // Validate required settings
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      return NextResponse.json(
        { error: "Missing required Azure settings (tenant ID, client ID, or client secret)" },
        { status: 400 },
      )
    }

    // Azure AD OAuth 2.0 token endpoint
    const tokenEndpoint = `https://login.microsoftonline.com/${azureSettings.tenant_id}/oauth2/v2.0/token`

    const params = new URLSearchParams({
      client_id: azureSettings.client_id,
      scope: "https://graph.microsoft.com/.default",
      client_secret: azureSettings.client_secret,
      grant_type: "client_credentials",
    })

    console.log("Requesting token from:", tokenEndpoint)

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: "Unknown error", error_description: errorText }
      }

      console.error("Token request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: `Failed to get Azure AD token: ${errorData.error_description || errorData.error || "Unknown error"}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Successfully obtained token")
    return NextResponse.json({ token: data.access_token })
  } catch (error) {
    console.error("Error getting Azure AD token:", error)
    return NextResponse.json(
      { error: `Failed to get Azure AD token: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Function to fetch users from Azure AD
async function getUsers(azureSettings: AzureSettings, pageSize = 100) {
  try {
    console.log("Fetching users from Azure AD with page size:", pageSize)

    // Get access token
    const tokenResponse = await getToken(azureSettings)
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json({ error: errorData.error }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.token

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token for Azure AD" }, { status: 500 })
    }

    // Fetch users from Microsoft Graph API with pagination
    const usersEndpoint = `${GRAPH_API_ENDPOINT}/users?$select=id,displayName,mail,jobTitle,department,userPrincipalName,accountEnabled&$top=${pageSize}`
    console.log("Fetching users from:", usersEndpoint)

    const response = await fetch(usersEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: { message: errorText } }
      }

      console.error("Users request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: `Failed to fetch users from Azure AD: ${errorData.error?.message || "Unknown error"}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.value.length} users from Azure AD`)

    // Return users and nextLink if available
    return NextResponse.json({
      users: data.value,
      nextLink: data["@odata.nextLink"] || null,
    })
  } catch (error) {
    console.error("Error fetching Azure AD users:", error)
    return NextResponse.json(
      { error: `Failed to fetch users from Azure AD: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Function to fetch the next page of users from Azure AD
async function getUsersNextPage(azureSettings: AzureSettings, nextLink: string) {
  try {
    console.log("Fetching next page of users from Azure AD:", nextLink)

    // Get access token
    const tokenResponse = await getToken(azureSettings)
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json({ error: errorData.error }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.token

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token for Azure AD" }, { status: 500 })
    }

    // Fetch next page of users
    const response = await fetch(nextLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { error: { message: errorText } }
      }

      console.error("Users next page request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: `Failed to fetch next page of users from Azure AD: ${errorData.error?.message || "Unknown error"}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.value.length} more users from Azure AD`)

    // Return users and nextLink if available
    return NextResponse.json({
      users: data.value,
      nextLink: data["@odata.nextLink"] || null,
    })
  } catch (error) {
    console.error("Error fetching next page of Azure AD users:", error)
    return NextResponse.json(
      {
        error: `Failed to fetch next page of users from Azure AD: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
