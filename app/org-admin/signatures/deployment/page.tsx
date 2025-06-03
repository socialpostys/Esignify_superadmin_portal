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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Monitor,
  Download,
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
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [templates, setTemplates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

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
        const { data: templateData, error: templateError } = await supabase
          .from("signature_templates")
          .select("*")
          .eq("organization_id", organizationId)

        if (templateError) {
          console.error("Error loading templates:", templateError)
        } else {
          setTemplates(templateData || [])

          // Set default template in form
          if (templateData && templateData.length > 0) {
            const defaultTemplate = templateData.find((t) => t.is_default) || templateData[0]
            setRuleConfig((prev) => ({
              ...prev,
              name: `Signature - ${orgData.name}`,
              description: `Email signature for ${orgData.name}`,
              htmlContent: defaultTemplate.html_content,
            }))
          }
        }

        // Get users
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("organization_id", organizationId)

        if (userError) {
          console.error("Error loading users:", userError)
        } else {
          setUsers(userData || [])
        }

        // Get transport rules
        const { data: ruleData, error: ruleError } = await supabase
          .from("transport_rules")
          .select("*")
          .eq("organization_id", organizationId)

        if (ruleError) {
          console.error("Error loading transport rules:", ruleError)
        } else {
          setTransportRules(ruleData || [])
        }

        // Get deployment logs
        const { data: logData, error: logError } = await supabase
          .from("deployment_logs")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(50)

        if (logError) {
          console.error("Error loading deployment logs:", logError)
        } else {
          setDeploymentLogs(logData || [])
        }

        // Test connection
        await testConnection()
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
        setSuccess("Successfully connected to Exchange Online")
      } else {
        setConnectionStatus("disconnected")
        setError(result.error || result.message || "Failed to connect to Exchange Online")
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      setError(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTesting(false)
    }
  }

  const deployRule = async () => {
    setIsDeploying(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate form
      if (!ruleConfig.name) {
        throw new Error("Rule name is required")
      }

      if (!ruleConfig.htmlContent) {
        throw new Error("HTML content is required")
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
        setSuccess(`Transport rule "${ruleConfig.name}" deployed successfully`)

        // Refresh transport rules
        await loadTransportRules()

        // Refresh deployment logs
        await loadDeploymentLogs()
      } else {
        setError(result.error || result.message || "Failed to deploy transport rule")
      }
    } catch (error) {
      setError(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDeploying(false)
    }
  }

  const loadTransportRules = async () => {
    try {
      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getRules",
        }),
      })

      const result = await response.json()

      if (response.ok && result.rules) {
        setTransportRules(result.rules)
      }
    } catch (error) {
      console.error("Failed to load transport rules:", error)
    }
  }

  const loadDeploymentLogs = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("deployment_logs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error loading deployment logs:", error)
      } else {
        setDeploymentLogs(data || [])
      }
    } catch (error) {
      console.error("Failed to load deployment logs:", error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteRule",
          ruleId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess("Transport rule deleted successfully")

        // Refresh transport rules
        await loadTransportRules()

        // Refresh deployment logs
        await loadDeploymentLogs()
      } else {
        setError(result.error || result.message || "Failed to delete transport rule")
      }
    } catch (error) {
      setError(`Failed to delete rule: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const exportLogs = () => {
    const logs = JSON.stringify(deploymentLogs, null, 2)
    const blob = new Blob([logs], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `deployment-logs-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
            <p className="text-muted-foreground">Manage server-side signature deployment with Exchange Online</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Connected to Exchange Online</span>
                  </>
                )}
                {connectionStatus === "disconnected" && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Disconnected from Exchange Online</span>
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

        <Tabs defaultValue="deploy" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deploy">Deploy Rules</TabsTrigger>
            <TabsTrigger value="manage">Manage Rules</TabsTrigger>
            <TabsTrigger value="monitor">Monitor & Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deploy Transport Rule</CardTitle>
                <CardDescription>Configure and deploy a new transport rule for email signatures</CardDescription>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Signature Location</Label>
                    <Select
                      value={ruleConfig.location}
                      onValueChange={(value) => setRuleConfig((prev) => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Append">Append</SelectItem>
                        <SelectItem value="Prepend">Prepend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fallbackAction">Fallback Action</Label>
                    <Select
                      value={ruleConfig.fallbackAction}
                      onValueChange={(value) => setRuleConfig((prev) => ({ ...prev, fallbackAction: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wrap">Wrap</SelectItem>
                        <SelectItem value="Ignore">Ignore</SelectItem>
                        <SelectItem value="Reject">Reject</SelectItem>
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enabled"
                    checked={ruleConfig.enabled}
                    onCheckedChange={(checked) => setRuleConfig((prev) => ({ ...prev, enabled: !!checked }))}
                  />
                  <Label htmlFor="enabled">Enable rule immediately</Label>
                </div>

                <Button
                  onClick={deployRule}
                  disabled={isDeploying || connectionStatus !== "connected"}
                  className="w-full"
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Deploy Transport Rule
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Transport Rules</CardTitle>
                <CardDescription>Manage your deployed transport rules</CardDescription>
              </CardHeader>
              <CardContent>
                {transportRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transport rules deployed yet</div>
                ) : (
                  <div className="space-y-4">
                    {transportRules.map((rule) => (
                      <div key={rule.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{rule.name}</h3>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={rule.is_enabled ? "default" : "secondary"}>
                                {rule.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Badge variant="outline">{rule.deployment_status}</Badge>
                              <span className="text-xs text-muted-foreground">Priority: {rule.priority}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => deleteRule(rule.exchange_rule_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Deployment Logs
                  </div>
                  <Button variant="outline" size="sm" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </CardTitle>
                <CardDescription>Monitor deployment activities and troubleshoot issues</CardDescription>
              </CardHeader>
              <CardContent>
                {deploymentLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No deployment logs available</div>
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
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer">Details</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
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
