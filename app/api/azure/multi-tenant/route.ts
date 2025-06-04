import { type NextRequest, NextResponse } from "next/server"
import type { AzureSettings } from "@/lib/types"

// Multi-tenant Azure AD API - uses organization's own credentials
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

    // Validate that organization has provided their own Azure credentials
    if (!settings.tenant_id || !settings.client_id || !settings.client_secret) {
      return NextResponse.json(
        {
          error:
            "This organization must configure their own Azure AD app registration. Please provide Tenant ID, Client ID, and Client Secret in the Azure settings.",
        },
        { status: 400 },
      )
    }

    switch (action) {
      case "getToken":
        return await getTokenForOrganization(settings)
      case "getUsers":
        return await getUsersForOrganization(settings, body.pageSize || 100)
      case "getUsersNextPage":
        return await getUsersNextPageForOrganization(settings, body.nextLink)
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in multi-tenant Azure API route:", error)
    return NextResponse.json(
      { error: `API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Get token using organization's own Azure AD app registration
async function getTokenForOrganization(azureSettings: AzureSettings) {
  try {
    console.log("Getting Azure AD token for organization:", azureSettings.organization_id, {
      tenant_id: azureSettings.tenant_id,
      client_id: azureSettings.client_id,
    })

    // Use the organization's own tenant for authentication
    const tokenEndpoint = `https://login.microsoftonline.com/${azureSettings.tenant_id}/oauth2/v2.0/token`

    const params = new URLSearchParams({
      client_id: azureSettings.client_id,
      scope: "https://graph.microsoft.com/.default",
      client_secret: azureSettings.client_secret,
      grant_type: "client_credentials",
    })

    console.log("Requesting token from organization's tenant:", tokenEndpoint)

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

      console.error("Token request failed for organization:", azureSettings.organization_id, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        {
          error: `Failed to authenticate with organization's Azure AD: ${errorData.error_description || errorData.error || "Unknown error"}. Please verify the Tenant ID, Client ID, and Client Secret are correct.`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Successfully obtained token for organization:", azureSettings.organization_id)
    return NextResponse.json({ token: data.access_token })
  } catch (error) {
    console.error("Error getting Azure AD token for organization:", azureSettings.organization_id, error)
    return NextResponse.json(
      { error: `Failed to get Azure AD token: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// Fetch users from organization's Azure AD
async function getUsersForOrganization(azureSettings: AzureSettings, pageSize = 100) {
  try {
    console.log("Fetching users from organization's Azure AD:", azureSettings.organization_id)

    // Get access token using organization's credentials
    const tokenResponse = await getTokenForOrganization(azureSettings)
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json({ error: errorData.error }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.token

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token for organization's Azure AD" }, { status: 500 })
    }

    // Fetch users from the organization's Azure AD tenant
    const usersEndpoint = `${GRAPH_API_ENDPOINT}/users?$select=id,displayName,mail,jobTitle,department,userPrincipalName,accountEnabled&$top=${pageSize}`
    console.log("Fetching users from organization's tenant:", usersEndpoint)

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

      console.error("Users request failed for organization:", azureSettings.organization_id, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        { error: `Failed to fetch users from organization's Azure AD: ${errorData.error?.message || "Unknown error"}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(
      `Successfully fetched ${data.value.length} users from organization's Azure AD:`,
      azureSettings.organization_id,
    )

    return NextResponse.json({
      users: data.value,
      nextLink: data["@odata.nextLink"] || null,
    })
  } catch (error) {
    console.error("Error fetching users for organization:", azureSettings.organization_id, error)
    return NextResponse.json(
      {
        error: `Failed to fetch users from organization's Azure AD: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

// Fetch next page of users from organization's Azure AD
async function getUsersNextPageForOrganization(azureSettings: AzureSettings, nextLink: string) {
  try {
    console.log("Fetching next page of users for organization:", azureSettings.organization_id)

    // Get access token using organization's credentials
    const tokenResponse = await getTokenForOrganization(azureSettings)
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json({ error: errorData.error }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.token

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token for organization's Azure AD" }, { status: 500 })
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

      console.error("Users next page request failed for organization:", azureSettings.organization_id, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        {
          error: `Failed to fetch next page of users from organization's Azure AD: ${errorData.error?.message || "Unknown error"}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`Successfully fetched ${data.value.length} more users for organization:`, azureSettings.organization_id)

    return NextResponse.json({
      users: data.value,
      nextLink: data["@odata.nextLink"] || null,
    })
  } catch (error) {
    console.error("Error fetching next page of users for organization:", azureSettings.organization_id, error)
    return NextResponse.json(
      {
        error: `Failed to fetch next page of users from organization's Azure AD: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
