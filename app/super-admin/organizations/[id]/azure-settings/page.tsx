"use client"

import type React from "react"
import type { AzureSettings } from "@/lib/types"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, HelpCircle, Eye, EyeOff, Copy, AlertTriangle } from "lucide-react"

export default function AzureSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("Organization")
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [settings, setSettings] = useState<AzureSettings>({
    id: `azure-${params.id}`,
    organization_id: params.id,
    tenant_id: "",
    client_id: "",
    client_secret: "",
    is_connected: false,
    sync_frequency: "manual",
    updated_at: new Date().toISOString(),
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch organization details
      const orgResponse = await fetch(`/api/organizations/${params.id}`)
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganizationName(orgData.organization?.name || "Organization")
      }

      // Fetch Azure settings
      const response = await fetch(`/api/organizations/${params.id}/azure-settings`)
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } else if (response.status !== 404) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load Azure settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Failed to load Azure settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleToggleChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields if connection is enabled
      if (settings.is_connected) {
        if (!settings.tenant_id || !settings.client_id || !settings.client_secret) {
          throw new Error("Tenant ID, Client ID, and Client Secret are required when connection is enabled")
        }
      }

      const response = await fetch(`/api/organizations/${params.id}/azure-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      const data = await response.json()
      setSettings(data.settings)
      setSuccess("Azure settings saved successfully")
    } catch (err) {
      console.error("Save error:", err)
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setError(null)

    try {
      if (!settings.tenant_id || !settings.client_id || !settings.client_secret) {
        throw new Error("Please fill in all Azure AD credentials before testing")
      }

      const response = await fetch(`/api/organizations/${params.id}/azure-settings/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: settings.tenant_id,
          client_id: settings.client_id,
          client_secret: settings.client_secret,
        }),
      })

      const result = await response.json()
      setTestResult(result)

      if (!result.success) {
        setError(result.message || "Connection test failed")
      }
    } catch (err) {
      console.error("Test error:", err)
      setError(err instanceof Error ? err.message : "Failed to test connection")
    } finally {
      setIsTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="super-admin" orgName={organizationName}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <p>Loading Azure settings...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin" orgName={organizationName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Azure AD Integration</h1>
          <p className="text-muted-foreground">Configure Azure Active Directory integration for {organizationName}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>Connection Test Result</AlertTitle>
            <AlertDescription>
              <p>{testResult.message}</p>
              {testResult.details && (
                <div className="mt-2 text-sm">
                  <p>
                    <strong>Organization:</strong> {testResult.details.organizationName}
                  </p>
                  <p>
                    <strong>Domains:</strong> {testResult.details.domains?.join(", ")}
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="setup">
          <TabsList>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            <TabsTrigger value="settings">Azure Settings</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Azure AD App Registration Setup</CardTitle>
                <CardDescription>
                  Follow these steps to create an Azure AD app registration for {organizationName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Multi-Tenant Setup</AlertTitle>
                  <AlertDescription>
                    Each organization needs its own Azure AD app registration in their own tenant. This ensures proper
                    security isolation between organizations.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 1: Create App Registration</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Go to the Azure Portal (portal.azure.com)</li>
                      <li>Navigate to Azure Active Directory → App registrations</li>
                      <li>Click "New registration"</li>
                      <li>
                        Enter name:{" "}
                        <code className="bg-gray-100 px-1 rounded">Email Signature Platform - {organizationName}</code>
                      </li>
                      <li>Select "Accounts in this organizational directory only"</li>
                      <li>
                        Add redirect URI:{" "}
                        <code className="bg-gray-100 px-1 rounded">https://your-domain.com/auth/callback</code>
                      </li>
                      <li>Click "Register"</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 2: Configure API Permissions</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Go to "API permissions" in your app registration</li>
                      <li>Click "Add a permission" → "Microsoft Graph" → "Application permissions"</li>
                      <li>
                        Add these permissions:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>
                            <code>User.Read.All</code> - Read all users
                          </li>
                          <li>
                            <code>Group.Read.All</code> - Read all groups
                          </li>
                          <li>
                            <code>Directory.Read.All</code> - Read directory data
                          </li>
                          <li>
                            <code>Mail.ReadWrite</code> - Read and write mail
                          </li>
                          <li>
                            <code>Exchange.ManageAsApp</code> - Manage Exchange Online
                          </li>
                        </ul>
                      </li>
                      <li>Click "Grant admin consent" (requires admin privileges)</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 3: Create Client Secret</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Go to "Certificates & secrets"</li>
                      <li>Click "New client secret"</li>
                      <li>
                        Add description:{" "}
                        <code className="bg-gray-100 px-1 rounded">Email Signature Platform Secret</code>
                      </li>
                      <li>Set expiration: 24 months</li>
                      <li>Click "Add" and copy the secret value immediately</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 4: Get Required Information</h3>
                    <p className="text-sm mb-2">From your Azure AD app registration, collect:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>
                        <strong>Directory (tenant) ID</strong> - From the Overview page
                      </li>
                      <li>
                        <strong>Application (client) ID</strong> - From the Overview page
                      </li>
                      <li>
                        <strong>Client secret</strong> - From step 3 above
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle>Azure AD Connection Settings</CardTitle>
                  <CardDescription>Configure the Azure AD connection for {organizationName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_connected" className="flex items-center gap-2">
                        Enable Azure AD Integration
                      </Label>
                      <Switch
                        id="is_connected"
                        name="is_connected"
                        checked={settings.is_connected}
                        onCheckedChange={(checked) => handleToggleChange("is_connected", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant_id">Directory (Tenant) ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tenant_id"
                          name="tenant_id"
                          placeholder="00000000-0000-0000-0000-000000000000"
                          value={settings.tenant_id}
                          onChange={handleChange}
                          required={settings.is_connected}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(settings.tenant_id)}
                          disabled={!settings.tenant_id}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_id">Application (Client) ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="client_id"
                          name="client_id"
                          placeholder="00000000-0000-0000-0000-000000000000"
                          value={settings.client_id}
                          onChange={handleChange}
                          required={settings.is_connected}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(settings.client_id)}
                          disabled={!settings.client_id}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_secret">Client Secret</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="client_secret"
                            name="client_secret"
                            type={showClientSecret ? "text" : "password"}
                            placeholder="Enter client secret"
                            value={settings.client_secret}
                            onChange={handleChange}
                            required={settings.is_connected}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowClientSecret(!showClientSecret)}
                          >
                            {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sync_frequency">Sync Frequency</Label>
                      <Select
                        value={settings.sync_frequency}
                        onValueChange={(value) => handleSelectChange("sync_frequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sync frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>

                      <Button type="button" variant="outline" onClick={testConnection} disabled={isTesting}>
                        {isTesting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Required Permissions</CardTitle>
                <CardDescription>Azure AD permissions needed for full functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Microsoft Graph Application Permissions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>
                          <code>User.Read.All</code>
                        </span>
                        <span className="text-sm text-muted-foreground">Read all user profiles</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>
                          <code>Group.Read.All</code>
                        </span>
                        <span className="text-sm text-muted-foreground">Read all groups</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>
                          <code>Directory.Read.All</code>
                        </span>
                        <span className="text-sm text-muted-foreground">Read directory data</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>
                          <code>Mail.ReadWrite</code>
                        </span>
                        <span className="text-sm text-muted-foreground">Read and write mail settings</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>
                          <code>Exchange.ManageAsApp</code>
                        </span>
                        <span className="text-sm text-muted-foreground">Manage Exchange Online</span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Admin Consent Required</AlertTitle>
                    <AlertDescription>
                      These permissions require admin consent from a Global Administrator in the organization's Azure AD
                      tenant.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
