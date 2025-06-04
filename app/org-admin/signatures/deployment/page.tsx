"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Monitor,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function DeploymentPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deploymentLogs, setDeploymentLogs] = useState<any[]>([])
  const [transportRules, setTransportRules] = useState<any[]>([])
  const [powershellScripts, setPowershellScripts] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [templates, setTemplates] = useState<any[]>([])

  // Form state
  const [ruleConfig, setRuleConfig] = useState({
    name: "",
    description: "",
    fromScope: "InOrganization",
    sentToScope: "NotInOrganization",
    fromAddresses: [] as string[],
    htmlContent: "",
    location: "Append",
    fallbackAction: "Wrap",
    priority: 0,
    enabled: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }

      // Get current organization ID from cookie
      const cookies = document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      const organizationId = cookies.organization_id

      if (!organizationId) {
        throw new Error("No organization selected")
      }

      // Get organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single()

      if (orgError) {
        throw new Error(`Failed to load organization: ${orgError.message}`)
      }

      setOrganization(orgData)

      // Get signature templates
      const { data: templateData } = await supabase
        .from("signature_templates")
        .select("*")
        .eq("organization_id", organizationId)

      setTemplates(templateData || [])

      if (templateData && templateData.length > 0) {
        const defaultTemplate = templateData.find((t) => t.is_default) || templateData[0]
        setRuleConfig((prev) => ({
          ...prev,
          name: `Signature - ${orgData.name}`,
          description: `Email signature for ${orgData.name}`,
          htmlContent: defaultTemplate.html_content,
        }))
      }

      // Get transport rules
      const { data: ruleData } = await supabase
        .from("transport_rules")
        .select("*")
        .eq("organization_id", organizationId)

      setTransportRules(ruleData || [])

      // Get PowerShell scripts
      const { data: scriptData } = await supabase
        .from("powershell_scripts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })

      setPowershellScripts(scriptData || [])

      // Get deployment logs
      const { data: logData } = await supabase
        .from("deployment_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50)

      setDeploymentLogs(logData || [])

      // Test connection
      await testConnection()
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "testConnection",
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setConnectionStatus("connected")
        setSuccess("Successfully connected to Microsoft 365")
      } else {
        setConnectionStatus("disconnected")
        setError(result.error || result.message || "Failed to connect to Microsoft 365")
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      setError(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTesting(false)
    }
  }

  const generateScript = async () => {
    setIsDeploying(true)
    setError(null)
    setSuccess(null)

    try {
      if (!ruleConfig.name || !ruleConfig.htmlContent) {
        throw new Error("Rule name and HTML content are required")
      }

      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deployRule",
          config: ruleConfig,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(
          `PowerShell script generated for "${ruleConfig.name}". Download and execute manually in Exchange Online PowerShell.`,
        )

        // Refresh data
        await fetchData()
      } else {
        setError(result.error || result.message || "Failed to generate PowerShell script")
      }
    } catch (error) {
      setError(`Script generation failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDeploying(false)
    }
  }

  const downloadScript = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/powershell/download?id=${scriptId}`)

      if (!response.ok) {
        throw new Error("Failed to download script")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transport-rule-${Date.now()}.ps1`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      setError(`Failed to download script: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="org-admin">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/signatures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exchange Online Deployment</h1>
            <p className="text-muted-foreground">Generate PowerShell scripts for manual Exchange Online deployment</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Important Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Manual Execution Required:</strong> This platform generates PowerShell scripts that must be manually
            executed in Exchange Online PowerShell. Real-time deployment is not possible due to Microsoft security
            restrictions.
          </AlertDescription>
        </Alert>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Microsoft 365 Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Connected to Microsoft 365</span>
                  </>
                )}
                {connectionStatus === "disconnected" && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Disconnected from Microsoft 365</span>
                  </>
                )}
                {connectionStatus === "unknown" && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="text-yellow-700">Connection status unknown</span>
                  </>
                )}
              </div>
              <Button variant="outline" onClick={testConnection} disabled={isTesting}>
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate">Generate Script</TabsTrigger>
            <TabsTrigger value="scripts">PowerShell Scripts</TabsTrigger>
            <TabsTrigger value="monitor">Monitor & Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Transport Rule Script</CardTitle>
                <CardDescription>
                  Configure and generate a PowerShell script for Exchange Online deployment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      value={ruleConfig.name}
                      onChange={(e) => setRuleConfig((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={ruleConfig.priority}
                      onChange={(e) =>
                        setRuleConfig((prev) => ({ ...prev, priority: Number.parseInt(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={ruleConfig.description}
                    onChange={(e) => setRuleConfig((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter rule description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromScope">From Scope</Label>
                    <Select
                      value={ruleConfig.fromScope}
                      onValueChange={(value) => setRuleConfig((prev) => ({ ...prev, fromScope: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="InOrganization">In Organization</SelectItem>
                        <SelectItem value="NotInOrganization">Not In Organization</SelectItem>
                        <SelectItem value="InOrganizationOrPartner">In Organization or Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sentToScope">Sent To Scope</Label>
                    <Select
                      value={ruleConfig.sentToScope}
                      onValueChange={(value) => setRuleConfig((prev) => ({ ...prev, sentToScope: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="InOrganization">In Organization</SelectItem>
                        <SelectItem value="NotInOrganization">Not In Organization</SelectItem>
                        <SelectItem value="InOrganizationOrPartner">In Organization or Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="htmlContent">HTML Content</Label>
                  <Textarea
                    id="htmlContent"
                    value={ruleConfig.htmlContent}
                    onChange={(e) => setRuleConfig((prev) => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="Enter HTML signature content"
                    rows={8}
                  />
                </div>

                <Button onClick={generateScript} disabled={isDeploying} className="w-full">
                  {isDeploying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate PowerShell Script
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated PowerShell Scripts</CardTitle>
                <CardDescription>Download and execute these scripts in Exchange Online PowerShell</CardDescription>
              </CardHeader>
              <CardContent>
                {powershellScripts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No PowerShell scripts generated yet</div>
                ) : (
                  <div className="space-y-4">
                    {powershellScripts.map((script) => (
                      <div key={script.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{script.rule_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(script.created_at).toLocaleString()}
                            </p>
                            <Badge variant={script.status === "pending_execution" ? "secondary" : "default"}>
                              {script.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => downloadScript(script.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Manual Setup Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold">Steps to execute PowerShell scripts:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Install Exchange Online PowerShell module:{" "}
                      <code className="bg-muted px-1 rounded">Install-Module -Name ExchangeOnlineManagement</code>
                    </li>
                    <li>
                      Connect to Exchange Online: <code className="bg-muted px-1 rounded">Connect-ExchangeOnline</code>
                    </li>
                    <li>Download the PowerShell script from above</li>
                    <li>Run the script in PowerShell</li>
                    <li>
                      Verify the transport rule was created:{" "}
                      <code className="bg-muted px-1 rounded">Get-TransportRule</code>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deploymentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No activity logs available</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {deploymentLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {log.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {log.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                            {log.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            <span className="font-medium">{log.operation}</span>
                            <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
