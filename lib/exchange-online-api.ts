import { createServerSupabaseClient } from "./supabase-client"
import { getSession } from "./auth"

interface ExchangeCredentials {
  tenantId: string
  clientId: string
  clientSecret: string
}

interface TransportRuleConfig {
  name: string
  description?: string
  fromAddresses?: string[]
  fromScope: "InOrganization" | "NotInOrganization" | "InOrganizationOrPartner"
  sentToScope: "InOrganization" | "NotInOrganization" | "InOrganizationOrPartner"
  htmlContent: string
  location: "Append" | "Prepend"
  fallbackAction: "Wrap" | "Ignore" | "Reject"
  priority?: number
  enabled: boolean
}

export class ExchangeOnlineAPI {
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private credentials: ExchangeCredentials
  private organizationId: string

  constructor(credentials: ExchangeCredentials, organizationId: string) {
    this.credentials = credentials
    this.organizationId = organizationId
  }

  // Get access token for Microsoft Graph API
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    try {
      // Azure AD OAuth 2.0 token endpoint
      const tokenEndpoint = `https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`

      const params = new URLSearchParams({
        client_id: this.credentials.clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: this.credentials.clientSecret,
        grant_type: "client_credentials",
      })

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get token: ${errorData.error_description || errorData.error || response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

      return this.accessToken
    } catch (error) {
      await this.logError("getAccessToken", error)
      throw error
    }
  }

  // Test connection to Exchange Online
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const token = await this.getAccessToken()

      // Test by getting organization info
      const response = await fetch("https://graph.microsoft.com/v1.0/organization", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Connection test failed: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()

      await this.logSuccess("testConnection", "Connection test successful")

      return {
        success: true,
        message: "Successfully connected to Exchange Online",
        details: {
          organizationName: data.value?.[0]?.displayName,
          organizationId: data.value?.[0]?.id,
          domains: data.value?.[0]?.verifiedDomains?.map((d: any) => d.name),
        },
      }
    } catch (error) {
      await this.logError("testConnection", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error testing connection",
      }
    }
  }

  // Create or update transport rule
  async deployTransportRule(config: TransportRuleConfig): Promise<{
    success: boolean
    ruleId?: string
    message: string
    errors?: string[]
  }> {
    try {
      const token = await this.getAccessToken()

      // Check if rule already exists
      const existingRule = await this.getTransportRuleByName(config.name)

      let result
      if (existingRule) {
        result = await this.updateTransportRule(existingRule.id, config)
      } else {
        result = await this.createTransportRule(config)
      }

      if (result.success) {
        // Save rule to database
        await this.saveTransportRuleToDatabase(result.ruleId!, config)
        await this.logSuccess("deployTransportRule", `Transport rule ${config.name} deployed successfully`)
      }

      return result
    } catch (error) {
      await this.logError("deployTransportRule", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error deploying transport rule",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  // Create new transport rule
  private async createTransportRule(config: TransportRuleConfig): Promise<{
    success: boolean
    ruleId?: string
    message: string
  }> {
    try {
      const token = await this.getAccessToken()

      const ruleData = {
        name: config.name,
        description: config.description || "",
        fromScope: config.fromScope,
        sentToScope: config.sentToScope,
        applyHtmlDisclaimerText: config.htmlContent,
        applyHtmlDisclaimerLocation: config.location,
        applyHtmlDisclaimerFallbackAction: config.fallbackAction,
        priority: config.priority || 0,
        state: config.enabled ? "Enabled" : "Disabled",
      }

      // Add from addresses if provided
      if (config.fromAddresses && config.fromAddresses.length > 0) {
        Object.assign(ruleData, { fromAddressContainsWords: config.fromAddresses })
      }

      const response = await fetch("https://graph.microsoft.com/v1.0/admin/exchange/transportRules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to create transport rule: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        ruleId: data.id,
        message: `Transport rule ${config.name} created successfully`,
      }
    } catch (error) {
      throw error
    }
  }

  // Update existing transport rule
  private async updateTransportRule(
    ruleId: string,
    config: TransportRuleConfig,
  ): Promise<{
    success: boolean
    ruleId?: string
    message: string
  }> {
    try {
      const token = await this.getAccessToken()

      const ruleData = {
        name: config.name,
        description: config.description || "",
        fromScope: config.fromScope,
        sentToScope: config.sentToScope,
        applyHtmlDisclaimerText: config.htmlContent,
        applyHtmlDisclaimerLocation: config.location,
        applyHtmlDisclaimerFallbackAction: config.fallbackAction,
        priority: config.priority || 0,
        state: config.enabled ? "Enabled" : "Disabled",
      }

      // Add from addresses if provided
      if (config.fromAddresses && config.fromAddresses.length > 0) {
        Object.assign(ruleData, { fromAddressContainsWords: config.fromAddresses })
      }

      const response = await fetch(`https://graph.microsoft.com/v1.0/admin/exchange/transportRules/${ruleId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update transport rule: ${errorData.error?.message || response.statusText}`)
      }

      return {
        success: true,
        ruleId: ruleId,
        message: `Transport rule ${config.name} updated successfully`,
      }
    } catch (error) {
      throw error
    }
  }

  // Get transport rule by name
  private async getTransportRuleByName(name: string): Promise<any> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch("https://graph.microsoft.com/v1.0/admin/exchange/transportRules", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get transport rules: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.value?.find((rule: any) => rule.name === name)
    } catch (error) {
      await this.logError("getTransportRuleByName", error)
      return null
    }
  }

  // Get all transport rules
  async getTransportRules(): Promise<any[]> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch("https://graph.microsoft.com/v1.0/admin/exchange/transportRules", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get transport rules: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.value || []
    } catch (error) {
      await this.logError("getTransportRules", error)
      return []
    }
  }

  // Delete transport rule
  async deleteTransportRule(ruleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`https://graph.microsoft.com/v1.0/admin/exchange/transportRules/${ruleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to delete transport rule: ${errorData.error?.message || response.statusText}`)
      }

      // Delete from database
      await this.deleteTransportRuleFromDatabase(ruleId)
      await this.logSuccess("deleteTransportRule", `Transport rule ${ruleId} deleted successfully`)

      return {
        success: true,
        message: "Transport rule deleted successfully",
      }
    } catch (error) {
      await this.logError("deleteTransportRule", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error deleting transport rule",
      }
    }
  }

  // Save transport rule to database
  private async saveTransportRuleToDatabase(exchangeRuleId: string, config: TransportRuleConfig): Promise<void> {
    try {
      const supabase = createServerSupabaseClient()

      // Check if rule exists in database
      const { data: existingRule } = await supabase
        .from("transport_rules")
        .select("id")
        .eq("name", config.name)
        .eq("organization_id", this.organizationId)
        .single()

      if (existingRule) {
        // Update existing rule
        await supabase
          .from("transport_rules")
          .update({
            exchange_rule_id: exchangeRuleId,
            description: config.description,
            from_addresses: config.fromAddresses,
            from_scope: config.fromScope,
            sent_to_scope: config.sentToScope,
            html_content: config.htmlContent,
            location: config.location,
            fallback_action: config.fallbackAction,
            priority: config.priority || 0,
            is_enabled: config.enabled,
            deployment_status: "deployed",
            last_deployed: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRule.id)
      } else {
        // Create new rule
        await supabase.from("transport_rules").insert({
          organization_id: this.organizationId,
          name: config.name,
          exchange_rule_id: exchangeRuleId,
          description: config.description,
          from_addresses: config.fromAddresses,
          from_scope: config.fromScope,
          sent_to_scope: config.sentToScope,
          html_content: config.htmlContent,
          location: config.location,
          fallback_action: config.fallbackAction,
          priority: config.priority || 0,
          is_enabled: config.enabled,
          deployment_status: "deployed",
          last_deployed: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error saving transport rule to database:", error)
      // Don't throw error here, just log it
      await this.logError("saveTransportRuleToDatabase", error)
    }
  }

  // Delete transport rule from database
  private async deleteTransportRuleFromDatabase(exchangeRuleId: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient()

      await supabase
        .from("transport_rules")
        .update({
          deployment_status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("exchange_rule_id", exchangeRuleId)
    } catch (error) {
      console.error("Error deleting transport rule from database:", error)
      // Don't throw error here, just log it
      await this.logError("deleteTransportRuleFromDatabase", error)
    }
  }

  // Log success to database
  private async logSuccess(operation: string, message: string, details?: any): Promise<void> {
    try {
      const supabase = createServerSupabaseClient()
      const session = await getSession()

      await supabase.from("deployment_logs").insert({
        organization_id: this.organizationId,
        operation,
        status: "success",
        message,
        details,
        user_id: session?.userId,
      })
    } catch (error) {
      console.error("Error logging success:", error)
    }
  }

  // Log error to database
  private async logError(operation: string, error: unknown): Promise<void> {
    try {
      const supabase = createServerSupabaseClient()
      const session = await getSession()

      await supabase.from("deployment_logs").insert({
        organization_id: this.organizationId,
        operation,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: { stack: error instanceof Error ? error.stack : undefined },
        user_id: session?.userId,
      })
    } catch (logError) {
      console.error("Error logging error:", logError)
    }
  }
}

// Factory function to create Exchange Online API instance
export async function createExchangeOnlineAPI(organizationId: string): Promise<ExchangeOnlineAPI | null> {
  try {
    const supabase = createServerSupabaseClient()

    // Get Azure settings for organization
    const { data: azureSettings, error } = await supabase
      .from("azure_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single()

    if (error || !azureSettings || !azureSettings.is_connected) {
      return null
    }

    return new ExchangeOnlineAPI(
      {
        tenantId: azureSettings.tenant_id,
        clientId: azureSettings.client_id,
        clientSecret: azureSettings.client_secret,
      },
      organizationId,
    )
  } catch (error) {
    console.error("Error creating Exchange Online API:", error)
    return null
  }
}
