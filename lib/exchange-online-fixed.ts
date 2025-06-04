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

  // Get access token for Exchange Online PowerShell
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    try {
      const tokenEndpoint = `https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`

      const params = new URLSearchParams({
        client_id: this.credentials.clientId,
        scope: "https://outlook.office365.com/.default", // Correct scope for Exchange Online
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

  // Test connection using Graph API (this actually works)
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Use Graph API token for testing
      const graphToken = await this.getGraphToken()

      const response = await fetch("https://graph.microsoft.com/v1.0/organization", {
        headers: {
          Authorization: `Bearer ${graphToken}`,
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
        message: "Successfully connected to Microsoft 365",
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

  // Get Graph API token (different scope)
  private async getGraphToken(): Promise<string> {
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
      throw new Error(`Failed to get Graph token: ${errorData.error_description || errorData.error}`)
    }

    const data = await response.json()
    return data.access_token
  }

  // Deploy transport rule - THIS REQUIRES MANUAL POWERSHELL EXECUTION
  async deployTransportRule(config: TransportRuleConfig): Promise<{
    success: boolean
    ruleId?: string
    message: string
    errors?: string[]
  }> {
    try {
      // Generate PowerShell script for manual execution
      const powershellScript = this.generatePowerShellScript(config)

      // Save script to database for download
      await this.savePowerShellScript(config.name, powershellScript)

      // Log that manual execution is required
      await this.logSuccess(
        "deployTransportRule",
        `PowerShell script generated for ${config.name}. Manual execution required.`,
        { script: powershellScript },
      )

      return {
        success: true,
        ruleId: `manual-${Date.now()}`,
        message: `PowerShell script generated. Please download and execute manually in Exchange Online PowerShell.`,
      }
    } catch (error) {
      await this.logError("deployTransportRule", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error generating PowerShell script",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  // Generate PowerShell script for manual execution
  private generatePowerShellScript(config: TransportRuleConfig): string {
    const escapedHtml = config.htmlContent.replace(/'/g, "''").replace(/"/g, '""')

    return `
# Exchange Online Transport Rule Script
# Generated on: ${new Date().toISOString()}
# Rule Name: ${config.name}

# Connect to Exchange Online (if not already connected)
# Connect-ExchangeOnline

try {
    # Check if rule already exists
    $existingRule = Get-TransportRule -Identity "${config.name}" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "Updating existing transport rule: ${config.name}" -ForegroundColor Cyan
        
        Set-TransportRule -Identity "${config.name}" \`
            -Description "${config.description || ""}" \`
            -FromScope "${config.fromScope}" \`
            -SentToScope "${config.sentToScope}" \`
            -ApplyHtmlDisclaimerLocation "${config.location}" \`
            -ApplyHtmlDisclaimerText @"
${escapedHtml}
"@ \`
            -ApplyHtmlDisclaimerFallbackAction "${config.fallbackAction}" \`
            -Enabled $${config.enabled} \`
            -Priority ${config.priority || 0}
            
        Write-Host "Transport rule updated successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Creating new transport rule: ${config.name}" -ForegroundColor Cyan
        
        New-TransportRule -Name "${config.name}" \`
            -Description "${config.description || ""}" \`
            -FromScope "${config.fromScope}" \`
            -SentToScope "${config.sentToScope}" \`
            -ApplyHtmlDisclaimerLocation "${config.location}" \`
            -ApplyHtmlDisclaimerText @"
${escapedHtml}
"@ \`
            -ApplyHtmlDisclaimerFallbackAction "${config.fallbackAction}" \`
            -Enabled $${config.enabled} \`
            -Priority ${config.priority || 0}
            
        Write-Host "Transport rule created successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Disconnect from Exchange Online
# Disconnect-ExchangeOnline -Confirm:$false
`
  }

  // Save PowerShell script to database for download
  private async savePowerShellScript(ruleName: string, script: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient()
      const session = await getSession()

      await supabase.from("powershell_scripts").insert({
        organization_id: this.organizationId,
        rule_name: ruleName,
        script_content: script,
        created_by: session?.userId,
        status: "pending_execution",
      })
    } catch (error) {
      console.error("Error saving PowerShell script:", error)
    }
  }

  // Get transport rules - MOCK IMPLEMENTATION (Exchange Online doesn't expose this via API)
  async getTransportRules(): Promise<any[]> {
    try {
      const supabase = createServerSupabaseClient()

      // Get rules from our database (manually tracked)
      const { data, error } = await supabase
        .from("transport_rules")
        .select("*")
        .eq("organization_id", this.organizationId)

      if (error) {
        throw new Error(`Failed to get transport rules from database: ${error.message}`)
      }

      return data || []
    } catch (error) {
      await this.logError("getTransportRules", error)
      return []
    }
  }

  // Delete transport rule - REQUIRES MANUAL EXECUTION
  async deleteTransportRule(ruleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = createServerSupabaseClient()

      // Get rule info
      const { data: rule } = await supabase.from("transport_rules").select("name").eq("id", ruleId).single()

      if (rule) {
        // Generate deletion script
        const deleteScript = `
# Delete Transport Rule Script
# Generated on: ${new Date().toISOString()}

# Connect to Exchange Online (if not already connected)
# Connect-ExchangeOnline

try {
    Remove-TransportRule -Identity "${rule.name}" -Confirm:$false
    Write-Host "Transport rule '${rule.name}' deleted successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error deleting rule: $_" -ForegroundColor Red
}

# Disconnect from Exchange Online
# Disconnect-ExchangeOnline -Confirm:$false
`

        // Save deletion script
        await supabase.from("powershell_scripts").insert({
          organization_id: this.organizationId,
          rule_name: `DELETE_${rule.name}`,
          script_content: deleteScript,
          status: "pending_execution",
        })

        // Mark rule as pending deletion
        await supabase
          .from("transport_rules")
          .update({
            deployment_status: "pending_deletion",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ruleId)
      }

      await this.logSuccess("deleteTransportRule", `Deletion script generated for rule`)

      return {
        success: true,
        message: "Deletion script generated. Please download and execute manually.",
      }
    } catch (error) {
      await this.logError("deleteTransportRule", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error generating deletion script",
      }
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

// Factory function - same as before
export async function createExchangeOnlineAPI(organizationId: string): Promise<ExchangeOnlineAPI | null> {
  try {
    const supabase = createServerSupabaseClient()

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
