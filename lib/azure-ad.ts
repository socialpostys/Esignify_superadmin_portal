import type { AzureSettings } from "@/lib/types"
import { updateOrganization } from "@/lib/client-storage"

// Function to get an access token for Microsoft Graph API via our API route
export async function getAzureADToken(azureSettings: AzureSettings): Promise<string> {
  try {
    console.log("Getting Azure AD token via API route")

    // Validate required settings
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      throw new Error("Missing required Azure settings (tenant ID, client ID, or client secret)")
    }

    const response = await fetch("/api/azure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getToken",
        settings: azureSettings,
      }),
    })

    if (!response.ok) {
      let errorMessage = "Failed to get Azure AD token"
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Successfully obtained token via API route")
    return data.token
  } catch (error) {
    console.error("Error getting Azure AD token:", error)
    throw error
  }
}

// Function to fetch all users from Azure AD with pagination
export async function fetchAzureADUsers(azureSettings: AzureSettings): Promise<any[]> {
  try {
    console.log("Fetching users from Azure AD via API route with pagination")

    // Validate required settings
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      throw new Error("Missing required Azure settings (tenant ID, client ID, or client secret)")
    }

    let allUsers: any[] = []
    let nextLink: string | null = null

    // First request
    const initialResponse = await fetch("/api/azure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getUsers",
        settings: azureSettings,
        pageSize: 999, // Request maximum page size
      }),
    })

    if (!initialResponse.ok) {
      let errorMessage = "Failed to fetch users from Azure AD"
      try {
        const errorData = await initialResponse.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        errorMessage = `${errorMessage}: ${initialResponse.statusText}`
      }
      throw new Error(errorMessage)
    }

    const initialData = await initialResponse.json()
    allUsers = [...initialData.users]
    nextLink = initialData.nextLink

    // Continue fetching if there are more pages
    while (nextLink) {
      console.log(`Fetching next page of users: ${nextLink}`)

      const nextPageResponse = await fetch("/api/azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getUsersNextPage",
          settings: azureSettings,
          nextLink,
        }),
      })

      if (!nextPageResponse.ok) {
        let errorMessage = "Failed to fetch next page of users from Azure AD"
        try {
          const errorData = await nextPageResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = `${errorMessage}: ${nextPageResponse.statusText}`
        }
        throw new Error(errorMessage)
      }

      const pageData = await nextPageResponse.json()
      allUsers = [...allUsers, ...pageData.users]
      nextLink = pageData.nextLink
    }

    console.log(`Successfully fetched ${allUsers.length} users from Azure AD via API route`)
    return allUsers
  } catch (error) {
    console.error("Error fetching Azure AD users:", error)
    throw error
  }
}

// Function to sync Azure AD users with our database
export async function syncAzureADUsers(organizationId: string, azureSettings: AzureSettings) {
  try {
    console.log("Starting Azure AD user sync for organization:", organizationId)

    // Fetch users from Azure AD
    const azureUsers = await fetchAzureADUsers(azureSettings)

    // Transform Azure AD users to our user format
    const transformedUsers = azureUsers.map((azureUser: any) => ({
      id: azureUser.id, // Use Azure AD ID as our ID
      auth_id: azureUser.id,
      email: azureUser.mail || azureUser.userPrincipalName,
      name: azureUser.displayName,
      role: "user", // Default role
      organization_id: organizationId,
      title: azureUser.jobTitle || null,
      department: azureUser.department || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: azureUser.accountEnabled,
      has_signature: false, // Default to no signature
    }))

    console.log(`Transformed ${transformedUsers.length} users for organization ${organizationId}`)

    // Update the organization with the new users
    updateOrganization(organizationId, (org) => {
      return {
        ...org,
        users: transformedUsers,
        users_count: transformedUsers.length,
        azure: {
          ...(org.azure || {}),
          lastSync: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }
    })

    // Return the transformed users
    return {
      users: transformedUsers,
      count: transformedUsers.length,
      last_sync: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error syncing Azure AD users:", error)
    throw error
  }
}
