// Client-side storage utility for the Email Signature Platform

// Get organization by ID
export function getOrganization(id: string) {
  try {
    // Store current organization ID for easy access
    localStorage.setItem("currentOrganizationId", id)

    // Check if we have organizations in localStorage
    const orgsJson = localStorage.getItem("newOrganizations")
    if (!orgsJson) return null

    // Parse organizations
    const orgs = JSON.parse(orgsJson)

    // Find organization by ID
    return orgs.find((org: any) => org.id === id) || null
  } catch (error) {
    console.error("Error getting organization:", error)
    return null
  }
}

// Update organization by ID
export function updateOrganization(id: string, updateFn: (org: any) => any) {
  try {
    // Check if we have organizations in localStorage
    const orgsJson = localStorage.getItem("newOrganizations")
    if (!orgsJson) return false

    // Parse organizations
    const orgs = JSON.parse(orgsJson)

    // Find organization index
    const orgIndex = orgs.findIndex((org: any) => org.id === id)
    if (orgIndex === -1) return false

    // Update organization
    orgs[orgIndex] = updateFn(orgs[orgIndex])

    // Save updated organizations
    localStorage.setItem("newOrganizations", JSON.stringify(orgs))

    return true
  } catch (error) {
    console.error("Error updating organization:", error)
    return false
  }
}

// Get all organizations
export function getAllOrganizations() {
  try {
    // Check if we have organizations in localStorage
    const orgsJson = localStorage.getItem("newOrganizations")
    if (!orgsJson) return []

    // Parse organizations
    return JSON.parse(orgsJson)
  } catch (error) {
    console.error("Error getting all organizations:", error)
    return []
  }
}

// Save all organizations
export function saveAllOrganizations(organizations: any[]) {
  try {
    localStorage.setItem("newOrganizations", JSON.stringify(organizations))
    return true
  } catch (error) {
    console.error("Error saving all organizations:", error)
    return false
  }
}

// Initialize organizations if not exists
export function initializeOrganizations() {
  try {
    // Check if we have organizations in localStorage
    const orgsJson = localStorage.getItem("newOrganizations")
    if (!orgsJson) {
      // Initialize with empty array
      localStorage.setItem("newOrganizations", JSON.stringify([]))
    }
    return true
  } catch (error) {
    console.error("Error initializing organizations:", error)
    return false
  }
}

// Get user settings
export function getUserSettings(userId: string) {
  try {
    // Check if we have user settings in localStorage
    const settingsJson = localStorage.getItem(`user_settings_${userId}`)
    if (!settingsJson) return null

    // Parse settings
    return JSON.parse(settingsJson)
  } catch (error) {
    console.error("Error getting user settings:", error)
    return null
  }
}

// Update user settings
export function updateUserSettings(userId: string, settings: any) {
  try {
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(settings))
    return true
  } catch (error) {
    console.error("Error updating user settings:", error)
    return false
  }
}

// Get Azure settings for organization
export function getAzureSettings(organizationId: string) {
  try {
    // Check if we have Azure settings in localStorage
    const settingsJson = localStorage.getItem(`azure_settings_${organizationId}`)
    if (!settingsJson) return null

    // Parse settings
    return JSON.parse(settingsJson)
  } catch (error) {
    console.error("Error getting Azure settings:", error)
    return null
  }
}

// Update Azure settings for organization
export function updateAzureSettings(organizationId: string, settings: any) {
  try {
    localStorage.setItem(`azure_settings_${organizationId}`, JSON.stringify(settings))
    return true
  } catch (error) {
    console.error("Error updating Azure settings:", error)
    return false
  }
}

// Initialize the client storage
export function initializeClientStorage() {
  initializeOrganizations()
  return true
}

export function setPersistentCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
}

export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    // Does this cookie string begin with the name we want?
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1)
    }
  }
  return null
}

export function saveOrganization(organization: any) {
  try {
    const organizations = getLocalData("newOrganizations", [])
    organizations.push(organization)
    localStorage.setItem("newOrganizations", JSON.stringify(organizations))
  } catch (error) {
    console.error("Error saving organization:", error)
  }
}

export function saveAzureSettings(settings: any) {
  try {
    localStorage.setItem(`azure_settings_${settings.organization_id}`, JSON.stringify(settings))
  } catch (error) {
    console.error("Error saving azure settings:", error)
  }
}

export function getLocalData(key: string, defaultValue: any) {
  try {
    const storedData = localStorage.getItem(key)
    return storedData ? JSON.parse(storedData) : defaultValue
  } catch (error) {
    console.error(`Error getting local data for key ${key}:`, error)
    return defaultValue
  }
}

// This file handles client-side storage operations

// Get all organizations from localStorage
export function getOrganizations() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const orgs = localStorage.getItem("organizations")
    return orgs ? JSON.parse(orgs) : []
  } catch (error) {
    console.error("Error getting organizations from localStorage:", error)
    return []
  }
}

// Save organizations to localStorage
export function saveOrganizations(organizations: any[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("organizations", JSON.stringify(organizations))
  } catch (error) {
    console.error("Error saving organizations to localStorage:", error)
  }
}

// Add organization
export function addOrganization(organization: any) {
  const organizations = getOrganizations()
  organizations.push(organization)
  saveOrganizations(organizations)
  return organization
}

// Update organization
export function updateOrganizationById(id: string, updater: (org: any) => any) {
  const organizations = getOrganizations()
  const index = organizations.findIndex((org: any) => org.id === id)

  if (index !== -1) {
    const updatedOrg = updater(organizations[index])
    organizations[index] = updatedOrg
    saveOrganizations(organizations)
    return updatedOrg
  }

  return null
}

// Delete organization
export function deleteOrganization(id: string) {
  const organizations = getOrganizations()
  const filteredOrgs = organizations.filter((org: any) => org.id !== id)
  saveOrganizations(filteredOrgs)
}

// Initialize default organization if none exists
export function initializeDefaultOrganization() {
  if (typeof window === "undefined") {
    return
  }

  const organizations = getOrganizations()

  if (organizations.length === 0) {
    // Create a default organization
    const defaultOrg = {
      id: "sherborne-qatar",
      name: "SHERBORNE QATAR",
      domain: "sherborneqatar.org",
      slug: "sherborneqatar",
      logo_url: null,
      adminName: "Admin",
      adminEmail: "admin@sherborneqatar.org",
      adminPassword: "admin123",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      users_count: 3,
      templates_count: 1,
      azure_status: "Not Connected",
      users: [
        {
          id: "user-1",
          organization_id: "sherborne-qatar",
          name: "John Doe",
          email: "john.doe@sherborneqatar.org",
          department: "IT",
          title: "IT Manager",
          is_active: true,
          has_signature: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "user-2",
          organization_id: "sherborne-qatar",
          name: "Jane Smith",
          email: "jane.smith@sherborneqatar.org",
          department: "HR",
          title: "HR Director",
          is_active: true,
          has_signature: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "user-3",
          organization_id: "sherborne-qatar",
          name: "Bani Hajer",
          email: "bani.hajer@sherborneqatar.org",
          department: "Marketing",
          title: "Marketing Manager",
          is_active: true,
          has_signature: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      signature_templates: [
        {
          id: "template-1",
          organization_id: "sherborne-qatar",
          name: "SHERBORNE QATAR",
          description: "Standard signature for all staff",
          html_content: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
<div>
  <strong>{{name}}</strong> | {{title}}
</div>
<div>{{company}}</div>
<div>Email: {{email}} | Phone: {{phone}}</div>
<div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
  <img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />
</div>
</div>`,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }

    addOrganization(defaultOrg)
  }
}
