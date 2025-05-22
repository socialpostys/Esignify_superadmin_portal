export interface AzureSettings {
  id: string
  organization_id: string
  tenant_id: string
  client_id: string
  client_secret: string
  is_connected: boolean
  sync_frequency: string
  sync_disabled_users?: boolean
  auto_provision?: boolean
  sync_groups?: boolean
  auto_assign_signatures?: boolean
  server_side_deployment?: boolean
  last_sync?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  auth_id?: string
  email: string
  name: string
  role: string
  organization_id: string
  title?: string | null
  department?: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  has_signature: boolean
  signature_template_id?: string | null
}

export interface SignatureTemplate {
  id: string
  name: string
  description?: string
  html_content: string
  is_default: boolean
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  domain: string
  logo_url?: string | null
  created_at: string
  updated_at: string
  users_count: number
  templates_count: number
  azure_status: "Pending" | "Connected" | "Error"
  adminName?: string
  adminEmail?: string
  adminPassword?: string
  users?: User[]
  signature_templates?: SignatureTemplate[]
  azure?: {
    tenantId: string
    clientId: string
    clientSecret: string
    isConnected: boolean
    syncFrequency: string
    lastSync?: string
    created_at: string
    updated_at: string
  }
}
