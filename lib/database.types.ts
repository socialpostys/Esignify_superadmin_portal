export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          domain: string
          slug: string
          admin_email: string | null
          admin_password_hash: string | null
          users_count: number
          templates_count: number
          azure_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          slug: string
          admin_email?: string | null
          admin_password_hash?: string | null
          users_count?: number
          templates_count?: number
          azure_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          slug?: string
          admin_email?: string | null
          admin_password_hash?: string | null
          users_count?: number
          templates_count?: number
          azure_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          name: string | null
          email: string
          department: string | null
          title: string | null
          is_active: boolean
          has_signature: boolean
          signature_template_id: string | null
          azure_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name?: string | null
          email: string
          department?: string | null
          title?: string | null
          is_active?: boolean
          has_signature?: boolean
          signature_template_id?: string | null
          azure_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string | null
          email?: string
          department?: string | null
          title?: string | null
          is_active?: boolean
          has_signature?: boolean
          signature_template_id?: string | null
          azure_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signature_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          html_content: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          html_content: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          html_content?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      azure_settings: {
        Row: {
          id: string
          organization_id: string
          tenant_id: string
          client_id: string
          client_secret: string
          is_connected: boolean
          sync_frequency: string
          sync_disabled_users: boolean
          auto_provision: boolean
          sync_groups: boolean
          auto_assign_signatures: boolean
          server_side_deployment: boolean
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          tenant_id: string
          client_id: string
          client_secret: string
          is_connected?: boolean
          sync_frequency?: string
          sync_disabled_users?: boolean
          auto_provision?: boolean
          sync_groups?: boolean
          auto_assign_signatures?: boolean
          server_side_deployment?: boolean
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          tenant_id?: string
          client_id?: string
          client_secret?: string
          is_connected?: boolean
          sync_frequency?: string
          sync_disabled_users?: boolean
          auto_provision?: boolean
          sync_groups?: boolean
          auto_assign_signatures?: boolean
          server_side_deployment?: boolean
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transport_rules: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          exchange_rule_id: string | null
          from_addresses: string[] | null
          from_scope: string
          sent_to_scope: string
          html_content: string
          location: string
          fallback_action: string
          priority: number
          is_enabled: boolean
          deployment_status: string
          last_deployed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          exchange_rule_id?: string | null
          from_addresses?: string[] | null
          from_scope?: string
          sent_to_scope?: string
          html_content: string
          location?: string
          fallback_action?: string
          priority?: number
          is_enabled?: boolean
          deployment_status?: string
          last_deployed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          exchange_rule_id?: string | null
          from_addresses?: string[] | null
          from_scope?: string
          sent_to_scope?: string
          html_content?: string
          location?: string
          fallback_action?: string
          priority?: number
          is_enabled?: boolean
          deployment_status?: string
          last_deployed?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deployment_logs: {
        Row: {
          id: string
          organization_id: string
          transport_rule_id: string | null
          operation: string
          status: string
          message: string
          details: Json | null
          user_id: string | null
          execution_time: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          transport_rule_id?: string | null
          operation: string
          status: string
          message: string
          details?: Json | null
          user_id?: string | null
          execution_time?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          transport_rule_id?: string | null
          operation?: string
          status?: string
          message?: string
          details?: Json | null
          user_id?: string | null
          execution_time?: number | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          role: string
          session_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          role: string
          session_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          role?: string
          session_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
          last_accessed?: string
        }
      }
    }
  }
}
