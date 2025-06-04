import type { AzureSettings } from "@/lib/types"
import { updateOrganization } from "@/lib/client-storage"

// Multi-tenant Azure AD integration - each org has their own app registration
export async function getAzureADToken(azureSettings: AzureSettings): Promise<string> {
  try {
    console.log("Getting Azure AD token for organization:", azureSettings.organization_id)

    // Validate that the organization has provided their own Azure credentials
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      throw new Error(
        "This organization must configure their own Azure AD app registration. Please provide Tenant ID, Client ID, and Client Secret in the Azure settings.",
      )
    }

    const response = await fetch("/api/azure/multi-tenant", {
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
        errorMessage = `${errorMessage}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Successfully obtained token for organization:", azureSettings.organization_id)
    return data.token
  } catch (error) {
    console.error("Error getting Azure AD token:", error)
    throw error
  }
}

// Function to fetch all users from Azure AD with pagination (multi-tenant)
export async function fetchAzureADUsers(azureSettings: AzureSettings): Promise<any[]> {
  try {
    console.log("Fetching users from Azure AD for organization:", azureSettings.organization_id)

    // Validate that the organization has provided their own Azure credentials
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      throw new Error(
        "This organization must configure their own Azure AD app registration. Please provide Tenant ID, Client ID, and Client Secret in the Azure settings.",
      )
    }

    let allUsers: any[] = []
    let nextLink: string | null = null

    // First request
    const initialResponse = await fetch("/api/azure/multi-tenant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getUsers",
        settings: azureSettings,
        pageSize: 999,
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
      console.log(`Fetching next page of users for organization ${azureSettings.organization_id}`)

      const nextPageResponse = await fetch("/api/azure/multi-tenant", {
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

    console.log(
      `Successfully fetched ${allUsers.length} users from Azure AD for organization ${azureSettings.organization_id}`,
    )
    return allUsers
  } catch (error) {
    console.error("Error fetching Azure AD users:", error)
    throw error
  }
}

// Function to sync Azure AD users with our database (multi-tenant)
export async function syncAzureADUsers(organizationId: string, azureSettings: AzureSettings) {
  try {
    console.log("Starting Azure AD user sync for organization:", organizationId)

    // Validate that this organization has configured their Azure AD integration
    if (!azureSettings.tenant_id || !azureSettings.client_id || !azureSettings.client_secret) {
      throw new Error(
        `Organization ${organizationId} must configure their own Azure AD app registration. Each organization needs to create their own Azure AD app in their tenant.`,
      )
    }

    // Fetch users from Azure AD using the organization's own credentials
    const azureUsers = await fetchAzureADUsers(azureSettings)

    // Transform Azure AD users to our user format
    const transformedUsers = azureUsers.map((azureUser: any) => ({
      id: azureUser.id,
      auth_id: azureUser.id,
      email: azureUser.mail || azureUser.userPrincipalName,
      name: azureUser.displayName,
      role: "user",
      organization_id: organizationId,
      title: azureUser.jobTitle || null,
      department: azureUser.department || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: azureUser.accountEnabled,
      has_signature: false,
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
