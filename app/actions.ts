"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { nanoid } from "nanoid"
import {
  getOrganization as getOrganizationClient,
  updateOrganization as updateOrganizationClient,
} from "@/lib/client-storage"
import { v4 as uuidv4 } from "uuid"

// Add these imports at the top of the file
import { syncAzureADUsers } from "@/lib/azure-ad"
import type { AzureSettings } from "@/lib/types"

// Initialize demo data in localStorage on the client side
export async function initializeClientStorage() {
  return {
    success: true,
  }
}

// Create a new organization
export async function createOrganization(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const domain = formData.get("domain") as string
    const slug = formData.get("slug") as string

    if (!name || !domain || !slug) {
      return { error: "Missing required fields" }
    }

    // Create organization object
    const organization = {
      id: nanoid(),
      name,
      domain,
      slug,
      users_count: 0,
      templates_count: 0,
      azure_status: "Not Connected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      users: [],
      signature_templates: [],
    }

    // Return the organization to be saved on the client
    return { success: true, organization }
  } catch (error) {
    console.error("Error creating organization:", error)
    return { error: "Failed to create organization" }
  }
}

// Create a Supabase client for server actions
const getSupabase = () => {
  const cookieStore = cookies()

  // Check if Supabase credentials are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found. Using fallback methods.")
    return null
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Authentication actions
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Special case for super admin
  if (email === "admin" && password === "admin123") {
    try {
      // Set session cookies for the super admin with longer expiration
      cookies().set("user_role", "super_admin", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      cookies().set("user_id", "admin-user-id", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      // Set organization cookie
      cookies().set("organization_id", "system-org-id", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      redirect("/super-admin/dashboard")
    } catch (error) {
      console.error("Unexpected error during super admin login:", error)
      return { error: `Unexpected error during login: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  // Check for organization admin login
  try {
    // Get all organizations from localStorage (client-side)
    // This is a fallback for the demo, in a real app we would query the database
    const orgs = await getOrganizationsFromLocalStorage()

    // Find an organization with this admin email
    const org = orgs.find((o: any) => o.adminEmail === email)

    if (org && (password === "admin123" || password === org.adminPassword)) {
      // Set cookies for organization admin with longer expiration
      cookies().set("user_role", "org_admin", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      cookies().set("user_id", email, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      cookies().set("organization_id", org.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      redirect("/org-admin/dashboard")
    }
  } catch (error) {
    console.error("Error checking for org admin:", error)
  }

  return { error: "Invalid login credentials" }
}

export async function signOut() {
  // Clear cookies
  cookies().delete("user_role")
  cookies().delete("user_id")
  cookies().delete("organization_id")

  redirect("/")
}

// Helper function to get organizations from localStorage
async function getOrganizationsFromLocalStorage() {
  try {
    // This is a server action, so we can't directly access localStorage
    // In a real app, we would query the database
    // For demo purposes, we'll return an empty array
    return []
  } catch (error) {
    console.error("Error getting organizations from localStorage:", error)
    return []
  }
}

// Organization actions
export async function getOrganizations() {
  try {
    // This is a server action, but we'll return an empty array
    // The actual data will be fetched on the client side
    return { organizations: [] }
  } catch (error) {
    console.error("Error getting organizations:", error)
    return { error: "Failed to get organizations" }
  }
}

// Get organization by ID
export async function getOrganization(id: string) {
  try {
    // This is a server action, but we'll return null
    // The actual data will be fetched on the client side
    return { organization: null }
  } catch (error) {
    console.error("Error getting organization:", error)
    return { error: "Failed to get organization" }
  }
}

// Update organization
export async function updateOrganization(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const domain = formData.get("domain") as string
    const slug = formData.get("slug") as string

    if (!id || !name || !domain || !slug) {
      return { error: "Missing required fields" }
    }

    // Return the updated fields to be saved on the client
    return {
      success: true,
      organization: {
        id,
        name,
        domain,
        slug,
        updated_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Error updating organization:", error)
    return { error: "Failed to update organization" }
  }
}

// Delete organization
export async function deleteOrganization(id: string) {
  try {
    if (!id) {
      return { error: "Missing organization ID" }
    }

    // Return success to be handled on the client
    return { success: true }
  } catch (error) {
    console.error("Error deleting organization:", error)
    return { error: "Failed to delete organization" }
  }
}

// Add user to organization
export async function addUser(formData: FormData) {
  try {
    const organizationId = formData.get("organization_id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const department = formData.get("department") as string
    const title = formData.get("title") as string

    if (!organizationId || !email) {
      return { error: "Missing required fields" }
    }

    // Create user object
    const user = {
      id: nanoid(),
      organization_id: organizationId,
      name: name || "",
      email,
      department: department || "",
      title: title || "",
      is_active: true,
      has_signature: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Return the user to be saved on the client
    return { success: true, user }
  } catch (error) {
    console.error("Error adding user:", error)
    return { error: "Failed to add user" }
  }
}

// Get users for organization
export async function getUsers() {
  try {
    // This is a server action, but we'll return an empty array
    // The actual data will be fetched on the client side
    return { users: [] }
  } catch (error) {
    console.error("Error getting users:", error)
    return { error: "Failed to get users" }
  }
}

// Update user
export async function updateUser(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const organizationId = formData.get("organization_id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const department = formData.get("department") as string
    const title = formData.get("title") as string
    const isActive = formData.get("is_active") === "on"

    if (!id || !organizationId || !email) {
      return { error: "Missing required fields" }
    }

    // Return the updated fields to be saved on the client
    return {
      success: true,
      user: {
        id,
        organization_id: organizationId,
        name,
        email,
        department,
        title,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return { error: "Failed to update user" }
  }
}

// Delete user
export async function deleteUser(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const organizationId = formData.get("organization_id") as string

    if (!id || !organizationId) {
      return { error: "Missing required fields" }
    }

    // Return success to be handled on the client
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user" }
  }
}

// Create signature template
export async function createSignatureTemplate(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const htmlContent = formData.get("html_content") as string
    const isDefault = formData.get("is_default") === "true"

    // Get organization ID from cookies
    const cookieStore = cookies()
    const organizationId = cookieStore.get("organization_id")?.value

    if (!name || !htmlContent || !organizationId) {
      return { error: "Missing required fields" }
    }

    // Create template object
    const template = {
      id: nanoid(),
      organization_id: organizationId,
      name,
      description: description || "",
      html_content: htmlContent,
      is_default: isDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Return the template to be saved on the client
    revalidatePath(`/org-admin/signatures/templates`)
    return { success: true, template }
  } catch (error) {
    console.error("Error creating signature template:", error)
    return { error: "Failed to create signature template" }
  }
}

// Get signature templates
export async function getSignatureTemplates() {
  try {
    // This is a server action, but we'll return an empty array
    // The actual data will be fetched on the client side
    return { templates: [] }
  } catch (error) {
    console.error("Error getting signature templates:", error)
    return { error: "Failed to get signature templates" }
  }
}

// Assign signatures to users
export async function assignSignatures(formData: FormData) {
  try {
    const userIds = formData.getAll("user_ids[]") as string[]
    const templateId = formData.get("template_id") as string
    const override = formData.get("override") === "on"

    // Get organization ID from cookies
    const cookieStore = cookies()
    const organizationId = cookieStore.get("organization_id")?.value

    if (!userIds.length || !templateId || !organizationId) {
      return { error: "Missing required fields" }
    }

    // Return the assignment data to be processed on the client
    revalidatePath(`/org-admin/users`)
    return {
      success: true,
      assignment: {
        organization_id: organizationId,
        user_ids: userIds,
        template_id: templateId,
        override,
      },
    }
  } catch (error) {
    console.error("Error assigning signatures:", error)
    return { error: "Failed to assign signatures" }
  }
}

// Login as super admin
export async function loginAsSuperAdmin(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    // Check credentials (demo only)
    if (email !== "admin@signify.com" || password !== "password") {
      return { error: "Invalid credentials" }
    }

    // Set cookies
    const cookieStore = cookies()
    cookieStore.set("user_role", "super-admin", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Redirect to dashboard
    redirect("/super-admin/dashboard")
  } catch (error) {
    console.error("Error logging in:", error)
    return { error: "Failed to log in" }
  }
}

// Login as organization admin
export async function loginAsOrgAdmin(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const organizationId = formData.get("organization_id") as string

    if (!email || !password || !organizationId) {
      return { error: "Email, password, and organization ID are required" }
    }

    // Check credentials (demo only)
    if (password !== "password") {
      return { error: "Invalid credentials" }
    }

    // Set cookies
    const cookieStore = cookies()
    cookieStore.set("user_role", "org-admin", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    cookieStore.set("organization_id", organizationId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Redirect to dashboard
    redirect("/org-admin/dashboard")
  } catch (error) {
    console.error("Error logging in:", error)
    return { error: "Failed to log in" }
  }
}

// Logout
export async function logout() {
  try {
    // Clear cookies
    const cookieStore = cookies()
    cookieStore.delete("user_role")
    cookieStore.delete("organization_id")

    // Redirect to home
    redirect("/")
  } catch (error) {
    console.error("Error logging out:", error)
    return { error: "Failed to log out" }
  }
}

// Save Azure AD settings
export async function saveAzureSettings(formData: FormData) {
  try {
    const organizationId = formData.get("organization_id") as string
    const tenantId = formData.get("tenant_id") as string
    const clientId = formData.get("client_id") as string
    const clientSecret = formData.get("client_secret") as string
    const isEnabled = formData.get("is_enabled") === "on"

    if (!organizationId || !tenantId || !clientId || !clientSecret) {
      return { error: "Missing required fields" }
    }

    // Create settings object
    const settings = {
      id: `azure-${organizationId}`,
      organization_id: organizationId,
      tenant_id: tenantId,
      client_id: clientId,
      client_secret: clientSecret,
      is_connected: isEnabled,
      sync_frequency: "manual",
      last_sync: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Return the settings to be saved on the client
    return { success: true, settings }
  } catch (error) {
    console.error("Error saving Azure settings:", error)
    return { error: "Failed to save Azure settings" }
  }
}

export async function syncAzureUsers() {
  try {
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected" }
    }

    // Get Azure settings
    const settingsResult = await getAzureSettings()

    if (settingsResult.error || !settingsResult.settings) {
      return { error: settingsResult.error || "Azure settings not found" }
    }

    const azureSettings = settingsResult.settings

    if (!azureSettings.is_connected) {
      return { error: "Azure AD connection is not enabled" }
    }

    // Sync users from Azure AD
    try {
      const syncResult = await syncAzureADUsers(organizationId, azureSettings)

      // In a real implementation, we would save these users to our database
      // For now, we'll store them in localStorage for the demo
      const storedOrgs = typeof window !== "undefined" ? localStorage.getItem("newOrganizations") : null
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs)
        const updatedOrgs = orgs.map((o: any) => {
          if (o.id === organizationId) {
            return {
              ...o,
              users: syncResult.users,
              users_count: syncResult.count,
              azure: {
                ...o.azure,
                lastSync: syncResult.last_sync,
              },
              updated_at: new Date().toISOString(),
            }
          }
          return o
        })

        localStorage.setItem("newOrganizations", JSON.stringify(updatedOrgs))
      }

      // Update Azure settings with last sync time
      await updateAzureSettings(new FormData())

      return {
        success: true,
        userCount: syncResult.count,
        lastSync: syncResult.last_sync,
      }
    } catch (syncError) {
      console.error("Error syncing users from Azure AD:", syncError)
      return {
        error: `Failed to sync users from Azure AD: ${syncError instanceof Error ? syncError.message : String(syncError)}`,
      }
    }
  } catch (error) {
    console.error("Error in syncAzureUsers:", error)
    return {
      error: `Failed to sync Azure users: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Helper function to parse cookies
function parseCookies() {
  if (typeof document === "undefined") {
    return {} as Record<string, string>
  }

  return document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    },
    {} as Record<string, string>,
  )
}

export async function getAzureSettings() {
  try {
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected", settings: null }
    }

    const supabase = getSupabase()

    if (supabase) {
      // Try to get Azure settings from Supabase
      const { data, error } = await supabase
        .from("azure_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is expected if no settings exist yet
        console.error("Supabase error fetching Azure settings:", error)
        return { error: error.message, settings: null }
      }

      return { settings: data || null }
    } else {
      // Fallback to localStorage for demo purposes
      // In a real app, we would always use a database
      try {
        // Get organization from localStorage
        const storedOrgs = typeof window !== "undefined" ? localStorage.getItem("newOrganizations") : null
        if (storedOrgs) {
          const orgs = JSON.parse(storedOrgs)
          const org = orgs.find((o: any) => o.id === organizationId)

          if (org && org.azure) {
            return {
              settings: {
                id: `azure-${organizationId}`,
                organization_id: organizationId,
                tenant_id: org.azure.tenantId || "",
                client_id: org.azure.clientId || "",
                client_secret: org.azure.clientSecret || "",
                is_connected: org.azure.isConnected || false,
                last_sync: org.azure.lastSync || null,
                sync_frequency: org.azure.syncFrequency || "manual",
                created_at: org.azure.created_at || new Date().toISOString(),
                updated_at: org.azure.updated_at || new Date().toISOString(),
              },
              userCount: org.users_count || 0,
            }
          }
        }

        // Return empty settings if not found
        return {
          settings: {
            id: `azure-${organizationId}`,
            organization_id: organizationId,
            tenant_id: "",
            client_id: "",
            client_secret: "",
            is_connected: false,
            sync_frequency: "manual",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error)
        return { error: "Failed to load Azure settings", settings: null }
      }
    }
  } catch (error) {
    console.error("Error in getAzureSettings:", error)
    return {
      error: `Failed to fetch Azure settings: ${error instanceof Error ? error.message : String(error)}`,
      settings: null,
    }
  }
}

export async function updateAzureSettings(formData: FormData) {
  try {
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected", settings: null }
    }

    // Extract form data
    const tenantId = formData.get("tenant_id") as string
    const clientId = formData.get("client_id") as string
    const clientSecret = formData.get("client_secret") as string
    const isConnected = formData.get("is_connected") === "on"
    const syncFrequency = (formData.get("sync_frequency") as string) || "manual"
    const syncDisabledUsers = formData.get("sync_disabled_users") === "on"
    const autoProvision = formData.get("auto_provision") === "on"
    const syncGroups = formData.get("sync_groups") === "on"
    const autoAssignSignatures = formData.get("auto_assign_signatures") === "on"
    const serverSideDeployment = formData.get("server_side_deployment") === "on"

    // If connection is enabled, validate required fields
    if (isConnected && (!tenantId || !clientId || !clientSecret)) {
      return {
        error: "Tenant ID, Client ID, and Client Secret are required when connection is enabled",
        settings: null,
      }
    }

    // Preserve existing client secret if masked value is provided
    let finalClientSecret = clientSecret
    if (clientSecret === "••••••••••••••••••••••••") {
      // Get existing settings to preserve the secret
      const existingSettings = await getAzureSettings()
      if (existingSettings.settings) {
        finalClientSecret = existingSettings.settings.client_secret
      }
    }

    const azureSettings: AzureSettings = {
      id: `azure-${organizationId}`,
      organization_id: organizationId,
      tenant_id: tenantId,
      client_id: clientId,
      client_secret: finalClientSecret,
      is_connected: isConnected,
      sync_frequency: syncFrequency || "manual",
      sync_disabled_users: syncDisabledUsers,
      auto_provision: autoProvision,
      sync_groups: syncGroups,
      auto_assign_signatures: autoAssignSignatures,
      server_side_deployment: serverSideDeployment,
      updated_at: new Date().toISOString(),
    }

    const supabase = getSupabase()

    if (supabase) {
      // Try to update Azure settings in Supabase
      const { data, error } = await supabase.from("azure_settings").upsert(azureSettings).select().single()

      if (error) {
        console.error("Supabase error updating Azure settings:", error)
        return { error: error.message, settings: null }
      }

      return { settings: data }
    } else {
      // Fallback to localStorage for demo purposes
      try {
        // Get organization from localStorage
        const storedOrgs = typeof window !== "undefined" ? localStorage.getItem("newOrganizations") : null
        if (storedOrgs) {
          const orgs = JSON.parse(storedOrgs)
          const updatedOrgs = orgs.map((o: any) => {
            if (o.id === organizationId) {
              return {
                ...o,
                azure: {
                  tenantId,
                  clientId,
                  clientSecret: finalClientSecret,
                  isConnected,
                  syncFrequency,
                  syncDisabledUsers,
                  autoProvision,
                  syncGroups,
                  autoAssignSignatures,
                  serverSideDeployment,
                  created_at: o.azure?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                azure_status: isConnected ? "Connected" : "Pending",
                updated_at: new Date().toISOString(),
              }
            }
            return o
          })

          localStorage.setItem("newOrganizations", JSON.stringify(updatedOrgs))

          // Return the updated settings
          return { settings: azureSettings }
        }

        return { error: "Organization not found", settings: null }
      } catch (error) {
        console.error("Error updating localStorage:", error)
        return { error: "Failed to update Azure settings", settings: null }
      }
    }
  } catch (error) {
    console.error("Error in updateAzureSettings:", error)
    return {
      error: `Failed to update Azure settings: ${error instanceof Error ? error.message : String(error)}`,
      settings: null,
    }
  }
}

// Create a new signature template
export async function createSignatureTemplate_old(formData: FormData) {
  try {
    // Get form data
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const htmlContent = formData.get("html_content") as string
    const isDefault = formData.has("is_default")

    // Validate required fields
    if (!name || !htmlContent) {
      return { error: "Name and HTML content are required" }
    }

    // Get organization ID from cookies
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected" }
    }

    // Get organization from localStorage
    const organization = getOrganizationClient(organizationId)

    if (!organization) {
      return { error: "Organization not found" }
    }

    // Create new template
    const newTemplate = {
      id: uuidv4(),
      name,
      description,
      html_content: htmlContent,
      is_default: isDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: organizationId,
    }

    // Update organization with new template
    updateOrganizationClient(organizationId, (org) => {
      const templates = org.signature_templates || []

      // If this is the default template, unset default on other templates
      if (isDefault) {
        templates.forEach((template: any) => {
          template.is_default = false
        })
      }

      return {
        ...org,
        signature_templates: [...templates, newTemplate],
        templates_count: templates.length + 1,
        updated_at: new Date().toISOString(),
      }
    })

    // Return success
    revalidatePath("/org-admin/signatures/templates")
    return { success: true, template: newTemplate }
  } catch (error) {
    console.error("Error creating signature template:", error)
    return { error: `Failed to create template: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// Get signature templates for the current organization
export async function getSignatureTemplates_old() {
  try {
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected", templates: [] }
    }

    const supabase = getSupabase()

    if (supabase) {
      // Try to get templates from Supabase
      const { data, error } = await supabase
        .from("signature_templates")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error fetching templates:", error)
        return { error: error.message, templates: [] }
      }

      return { templates: data || [] }
    } else {
      // Fallback to localStorage for demo purposes
      try {
        // Get organization from localStorage
        const organization = getOrganizationClient(organizationId)

        if (organization && organization.signature_templates) {
          return { templates: organization.signature_templates }
        }

        // Return empty array if no templates found
        return { templates: [] }
      } catch (error) {
        console.error("Error reading from localStorage:", error)
        return { error: "Failed to load signature templates", templates: [] }
      }
    }
  } catch (error) {
    console.error("Error in getSignatureTemplates:", error)
    return {
      error: `Failed to fetch signature templates: ${error instanceof Error ? error.message : String(error)}`,
      templates: [],
    }
  }
}

// Assign signatures to users
export async function assignSignatures_old(formData: FormData) {
  try {
    const organizationId = cookies().get("organization_id")?.value

    if (!organizationId) {
      return { error: "No organization selected" }
    }

    // Get form data
    const userIds = formData.getAll("user_ids") as string[]
    const templateId = formData.get("template_id") as string

    // Validate required fields
    if (!userIds.length || !templateId) {
      return { error: "User IDs and template ID are required" }
    }

    // Get organization from localStorage
    const organization = getOrganizationClient(organizationId)

    if (!organization) {
      return { error: "Organization not found" }
    }

    // Get template
    const templates = organization.signature_templates || []
    const template = templates.find((t: any) => t.id === templateId)

    if (!template) {
      return { error: "Signature template not found" }
    }

    // Update users with assigned signature
    updateOrganizationClient(organizationId, (org) => {
      const users = org.users || []
      const updatedUsers = users.map((user: any) => {
        if (userIds.includes(user.id)) {
          return {
            ...user,
            has_signature: true,
            signature_template_id: templateId,
            updated_at: new Date().toISOString(),
          }
        }
        return user
      })

      return {
        ...org,
        users: updatedUsers,
        updated_at: new Date().toISOString(),
      }
    })

    // Return success
    revalidatePath("/org-admin/users")
    return { success: true, assignedCount: userIds.length }
  } catch (error) {
    console.error("Error assigning signatures:", error)
    return { error: `Failed to assign signatures: ${error instanceof Error ? error.message : String(error)}` }
  }
}
