import { getSupabaseClient } from "./supabase-client" // Declared the variable here

export async function migrateLocalStorageToDatabase() {
  try {
    // This function would be run on the client side
    if (typeof window === "undefined") {
      return { success: false, error: "This function must be run on the client side" }
    }

    // Get data from localStorage
    const organizations = JSON.parse(localStorage.getItem("newOrganizations") || "[]")

    if (organizations.length === 0) {
      return { success: true, message: "No data to migrate" }
    }

    // Get Supabase client
    const supabase = getSupabaseClient()

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    // Migrate each organization
    for (const org of organizations) {
      // Insert organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: org.id,
          name: org.name,
          domain: org.domain,
          slug: org.slug || org.domain.split(".")[0],
          admin_email: org.adminEmail,
          admin_password_hash: org.adminPassword, // In production, hash this password
          users_count: org.users_count || 0,
          templates_count: org.templates_count || 0,
          azure_status: org.azure_status || "Not Connected",
          created_at: org.created_at || new Date().toISOString(),
          updated_at: org.updated_at || new Date().toISOString(),
        })
        .select()
        .single()

      if (orgError) {
        console.error("Error migrating organization:", orgError)
        continue
      }

      // Migrate users
      if (org.users && org.users.length > 0) {
        for (const user of org.users) {
          await supabase.from("users").insert({
            id: user.id,
            organization_id: org.id,
            name: user.name,
            email: user.email,
            department: user.department,
            title: user.title,
            is_active: user.is_active !== undefined ? user.is_active : true,
            has_signature: user.has_signature || false,
            signature_template_id: user.signature_template_id,
            azure_id: user.auth_id,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString(),
          })
        }
      }

      // Migrate signature templates
      if (org.signature_templates && org.signature_templates.length > 0) {
        for (const template of org.signature_templates) {
          await supabase.from("signature_templates").insert({
            id: template.id,
            organization_id: org.id,
            name: template.name,
            description: template.description,
            html_content: template.html_content,
            is_default: template.is_default || false,
            created_at: template.created_at || new Date().toISOString(),
            updated_at: template.updated_at || new Date().toISOString(),
          })
        }
      }

      // Migrate Azure settings
      if (org.azure) {
        await supabase.from("azure_settings").insert({
          organization_id: org.id,
          tenant_id: org.azure.tenantId || "",
          client_id: org.azure.clientId || "",
          client_secret: org.azure.clientSecret || "",
          is_connected: org.azure.isConnected || false,
          sync_frequency: org.azure.syncFrequency || "manual",
          last_sync: org.azure.lastSync,
          created_at: org.azure.created_at || new Date().toISOString(),
          updated_at: org.azure.updated_at || new Date().toISOString(),
        })
      }
    }

    return { success: true, message: "Data migration completed successfully" }
  } catch (error) {
    console.error("Error migrating data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error migrating data",
    }
  }
}
