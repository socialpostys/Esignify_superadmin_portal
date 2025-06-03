import type { AzureSettings } from "@/lib/types"

// Exchange Online API endpoints
const GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"
const EXCHANGE_ADMIN_ENDPOINT = "https://outlook.office365.com/powershell-liveid"

export interface TransportRuleConfig {
  name: string
  description?: string
  fromScope: "InOrganization" | "NotInOrganization" | "InOrganizationOrPartner"
  sentToScope: "InOrganization" | "NotInOrganization" | "InOrganizationOrPartner"
  fromAddressContainsWords?: string[]
  senderDomainIs?: string[]
  recipientDomainIs?: string[]
  subjectContainsWords?: string[]
  messageTypeMatches?: string
  applyHtmlDisclaimerLocation: "Append" | "Prepend"
  applyHtmlDisclaimerText: string
  applyHtmlDisclaimerFallbackAction: "Wrap" | "Ignore" | "Reject"
  enabled: boolean
  priority?: number
  conditions?: TransportRuleCondition[]
  exceptions?: TransportRuleException[]
}

export interface TransportRuleCondition {
  type: string
  value: string | string[]
}

export interface TransportRuleException {
  type: string
  value: string | string[]
}

export interface ExchangeConnectorConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  certificateThumbprint?: string
  useModernAuth: boolean
  connectionTimeout: number
  retryAttempts: number
}

export interface DeploymentResult {
  success: boolean
  ruleId?: string
  ruleName?: string
  message: string
  errors?: string[]
  warnings?: string[]
  executionTime: number
}

export interface DeploymentLog {
  id: string
  timestamp: string
  operation: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
  userId?: string
  organizationId?: string
}

export class ExchangeOnlineService {
  private config: ExchangeConnectorConfig
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private logs: DeploymentLog[] = []

  constructor(config: ExchangeConnectorConfig) {
    this.config = config
  }

  // Authentication and token management
  async authenticate(): Promise<boolean> {
    try {
      this.log("info", "Starting authentication with Exchange Online")

      const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`

      const params = new URLSearchParams({
        client_id: this.config.clientId,
        scope: "https://graph.microsoft.com/.default https://outlook.office365.com/.default",
        client_secret: this.config.clientSecret,
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
        throw new Error(`Authentication failed: ${errorData.error_description || errorData.error}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

      this.log("success", "Successfully authenticated with Exchange Online")
      return true
    } catch (error) {
      this.log("error", `Authentication failed: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  // Check if token is valid and refresh if needed
  async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      return await this.authenticate()
    }
    return true
  }

  // Create or update transport rule
  async deployTransportRule(config: TransportRuleConfig): Promise<DeploymentResult> {
    const startTime = Date.now()

    try {
      this.log("info", `Starting deployment of transport rule: ${config.name}`)

      // Ensure we have a valid token
      if (!(await this.ensureValidToken())) {
        throw new Error("Failed to authenticate with Exchange Online")
      }

      // Check if rule already exists
      const existingRule = await this.getTransportRule(config.name)

      let result: DeploymentResult

      if (existingRule) {
        this.log("info", `Updating existing transport rule: ${config.name}`)
        result = await this.updateTransportRule(existingRule.id, config)
      } else {
        this.log("info", `Creating new transport rule: ${config.name}`)
        result = await this.createTransportRule(config)
      }

      result.executionTime = Date.now() - startTime

      if (result.success) {
        this.log("success", `Transport rule deployment completed: ${config.name}`)
      } else {
        this.log("error", `Transport rule deployment failed: ${result.message}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log("error", `Transport rule deployment error: ${errorMessage}`)

      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage],
        executionTime: Date.now() - startTime,
      }
    }
  }

  // Create new transport rule via Graph API
  private async createTransportRule(config: TransportRuleConfig): Promise<DeploymentResult> {
    try {
      // Use Exchange Online PowerShell via REST API
      const powershellCommand = this.generatePowerShellCommand("New-TransportRule", config)

      const response = await fetch("/api/exchange/powershell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          command: powershellCommand,
          tenantId: this.config.tenantId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to create transport rule: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        ruleId: result.ruleId,
        ruleName: config.name,
        message: `Transport rule '${config.name}' created successfully`,
      }
    } catch (error) {
      throw new Error(`Failed to create transport rule: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Update existing transport rule
  private async updateTransportRule(ruleId: string, config: TransportRuleConfig): Promise<DeploymentResult> {
    try {
      const powershellCommand = this.generatePowerShellCommand("Set-TransportRule", config, ruleId)

      const response = await fetch("/api/exchange/powershell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          command: powershellCommand,
          tenantId: this.config.tenantId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update transport rule: ${errorData.error || response.statusText}`)
      }

      return {
        success: true,
        ruleId: ruleId,
        ruleName: config.name,
        message: `Transport rule '${config.name}' updated successfully`,
      }
    } catch (error) {
      throw new Error(`Failed to update transport rule: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Get existing transport rule
  private async getTransportRule(ruleName: string): Promise<any> {
    try {
      const response = await fetch("/api/exchange/transport-rules", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        return null
      }

      const rules = await response.json()
      return rules.find((rule: any) => rule.name === ruleName)
    } catch (error) {
      this.log(
        "warning",
        `Failed to check for existing transport rule: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    }
  }

  // Generate PowerShell command for transport rule operations
  private generatePowerShellCommand(cmdlet: string, config: TransportRuleConfig, ruleId?: string): string {
    const params: string[] = []

    if (cmdlet === "Set-TransportRule" && ruleId) {
      params.push(`-Identity "${ruleId}"`)
    } else if (cmdlet === "New-TransportRule") {
      params.push(`-Name "${config.name}"`)
    }

    if (config.description) {
      params.push(`-Description "${config.description}"`)
    }

    params.push(`-FromScope "${config.fromScope}"`)
    params.push(`-SentToScope "${config.sentToScope}"`)

    if (config.fromAddressContainsWords && config.fromAddressContainsWords.length > 0) {
      params.push(`-FromAddressContainsWords @("${config.fromAddressContainsWords.join('","')}")`)
    }

    if (config.senderDomainIs && config.senderDomainIs.length > 0) {
      params.push(`-SenderDomainIs @("${config.senderDomainIs.join('","')}")`)
    }

    if (config.recipientDomainIs && config.recipientDomainIs.length > 0) {
      params.push(`-RecipientDomainIs @("${config.recipientDomainIs.join('","')}")`)
    }

    params.push(`-ApplyHtmlDisclaimerLocation "${config.applyHtmlDisclaimerLocation}"`)
    params.push(`-ApplyHtmlDisclaimerText "${config.applyHtmlDisclaimerText.replace(/"/g, '""')}"`)
    params.push(`-ApplyHtmlDisclaimerFallbackAction "${config.applyHtmlDisclaimerFallbackAction}"`)
    params.push(`-Enabled $${config.enabled}`)

    if (config.priority !== undefined) {
      params.push(`-Priority ${config.priority}`)
    }

    // Add conditions
    if (config.conditions && config.conditions.length > 0) {
      config.conditions.forEach((condition) => {
        params.push(
          `-${condition.type} "${Array.isArray(condition.value) ? condition.value.join('","') : condition.value}"`,
        )
      })
    }

    // Add exceptions
    if (config.exceptions && config.exceptions.length > 0) {
      config.exceptions.forEach((exception) => {
        params.push(
          `-Except${exception.type} "${Array.isArray(exception.value) ? exception.value.join('","') : exception.value}"`,
        )
      })
    }

    return `${cmdlet} ${params.join(" ")}`
  }

  // Validate transport rule configuration
  validateConfig(config: TransportRuleConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Rule name is required")
    }

    if (!config.applyHtmlDisclaimerText || config.applyHtmlDisclaimerText.trim().length === 0) {
      errors.push("HTML disclaimer text is required")
    }

    if (config.name && config.name.length > 64) {
      errors.push("Rule name must be 64 characters or less")
    }

    if (config.applyHtmlDisclaimerText && config.applyHtmlDisclaimerText.length > 5000) {
      errors.push("HTML disclaimer text must be 5000 characters or less")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Test connection to Exchange Online
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.log("info", "Testing connection to Exchange Online")

      if (!(await this.authenticate())) {
        return {
          success: false,
          message: "Failed to authenticate with Exchange Online",
        }
      }

      // Test by getting organization config
      const response = await fetch("/api/exchange/test", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          message: "Failed to connect to Exchange Online services",
        }
      }

      const data = await response.json()

      this.log("success", "Exchange Online connection test successful")

      return {
        success: true,
        message: "Successfully connected to Exchange Online",
        details: data,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log("error", `Exchange Online connection test failed: ${errorMessage}`)

      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  // Get all transport rules
  async getTransportRules(): Promise<any[]> {
    try {
      if (!(await this.ensureValidToken())) {
        throw new Error("Failed to authenticate")
      }

      const response = await fetch("/api/exchange/transport-rules", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to retrieve transport rules")
      }

      return await response.json()
    } catch (error) {
      this.log("error", `Failed to get transport rules: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  // Delete transport rule
  async deleteTransportRule(ruleId: string): Promise<DeploymentResult> {
    const startTime = Date.now()

    try {
      if (!(await this.ensureValidToken())) {
        throw new Error("Failed to authenticate")
      }

      const response = await fetch(`/api/exchange/transport-rules/${ruleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete transport rule")
      }

      this.log("success", `Transport rule deleted: ${ruleId}`)

      return {
        success: true,
        message: "Transport rule deleted successfully",
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.log("error", `Failed to delete transport rule: ${errorMessage}`)

      return {
        success: false,
        message: errorMessage,
        executionTime: Date.now() - startTime,
      }
    }
  }

  // Logging functionality
  private log(level: "info" | "success" | "warning" | "error", message: string, details?: any): void {
    const logEntry: DeploymentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation: "exchange_deployment",
      status: level === "info" ? "success" : level,
      message,
      details,
    }

    this.logs.push(logEntry)

    // Keep only last 100 log entries
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }

    // Console logging for development
    console.log(`[${level.toUpperCase()}] ${message}`, details || "")
  }

  // Get deployment logs
  getLogs(): DeploymentLog[] {
    return [...this.logs]
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Factory function to create Exchange Online service instance
export function createExchangeOnlineService(azureSettings: AzureSettings): ExchangeOnlineService {
  const config: ExchangeConnectorConfig = {
    tenantId: azureSettings.tenant_id,
    clientId: azureSettings.client_id,
    clientSecret: azureSettings.client_secret,
    useModernAuth: true,
    connectionTimeout: 30000,
    retryAttempts: 3,
  }

  return new ExchangeOnlineService(config)
}
