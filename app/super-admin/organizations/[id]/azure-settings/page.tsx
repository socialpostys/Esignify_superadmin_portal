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
import { Loader2, AlertCircle, CheckCircle, RefreshCw, HelpCircle, Eye, EyeOff } from "lucide-react"
import { getOrganization, getAzureSettings, saveAzureSettings } from "@/lib/client-storage"
import { syncAzureADUsers } from "@/lib/azure-ad"

export default function AzureSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState("Your Organization")
  const [debugMode, setDebugMode] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [showClientSecret, setShowClientSecret] = useState(false)
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

  // Helper function to add debug logs
  const addDebugLog = (message: string) => {
    if (debugMode) {
      setDebugLog((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
      console.log(message)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = () => {
    setIsLoading(true)
    setError(null)

    try {
      addDebugLog(`Fetching settings for organization ${params.id}`)

      // Get organization from localStorage
      const org = getOrganization(params.id)

      if (org) {
        addDebugLog(`Found organization: ${org.name}`)
        setOrganizationName(org.name || "Your Organization")

        // Get Azure settings
        const azureSettings = getAzureSettings(params.id)

        if (azureSettings) {
          addDebugLog(`Found Azure settings for organization`)
          setSettings(azureSettings)
        } else {
          addDebugLog(`No Azure settings found, using defaults`)
        }
      } else {
        addDebugLog(`Organization not found in localStorage`)
        setError("Organization not found")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      addDebugLog(`Error fetching settings: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Failed to load settings: ${error instanceof Error ? error.message : String(error)}`)
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
    setDebugLog([])

    try {
      addDebugLog(`Saving Azure settings for organization ${params.id}`)

      // Validate required fields if connection is enabled
      if (settings.is_connected) {
        if (!settings.tenant_id || !settings.client_id || !settings.client_secret) {
          throw new Error("Tenant ID, Client ID, and Client Secret are required when connection is enabled")
        }
      }

      addDebugLog(`Settings validated, proceeding with save`)

      // Update settings with current timestamp
      const updatedSettings = {
        ...settings,
        updated_at: new Date().toISOString(),
      }

      // Save Azure settings
      saveAzureSettings(updatedSettings)

      addDebugLog(`Azure settings saved successfully`)
      setSuccess("Azure settings saved successfully")

      // Update local state
      setSettings(updatedSettings)
    } catch (err) {
      console.error("Save error:", err)
      addDebugLog(`Save error: ${err instanceof Error ? err.message : String(err)}`)
      setError(`Failed to save settings: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncSuccess(null)
    setError(null)
    setDebugLog([])

    try {
      addDebugLog(`Starting sync for organization ${params.id}`)

      // Validate Azure settings
      if (!settings.tenant_id || !settings.client_id || !settings.client_secret) {
        throw new Error("Missing required Azure settings (tenant ID, client ID, or client secret)")
      }

      if (!settings.is_connected) {
        throw new Error("Azure AD is not connected. Please enable the connection first.")
      }

      addDebugLog(`Azure settings validated, proceeding with sync`)

      // Sync users from Azure AD
      const syncResult = await syncAzureADUsers(params.id, settings)

      addDebugLog(`Sync completed, got ${syncResult.count} users`)
      setSyncSuccess(`Successfully synced ${syncResult.count} users from Azure AD`)

      // Update settings with last sync time
      const updatedSettings = {
        ...settings,
        last_sync: syncResult.last_sync,
      }

      // Save updated settings
      saveAzureSettings(updatedSettings)

      // Update local state
      setSettings(updatedSettings)

      // Refresh the page to show updated user count
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      console.error("Sync error:", err)
      addDebugLog(`Sync error: ${err instanceof Error ? err.message : String(err)}`)
      setError(`Failed to sync users: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSyncing(false)
    }
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
          <p className="text-muted-foreground">Configure Azure Active Directory integration for user management</p>
        </div>

        <div className="flex items-center gap-2">
          {debugMode && (
            <Button variant="outline" size="sm" onClick={() => setDebugMode(false)}>
              Debug: ON
            </Button>
          )}
          {!debugMode && (
            <Button variant="ghost" size="sm" onClick={() => setDebugMode(true)}>
              Debug
            </Button>
          )}
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

        {syncSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{syncSuccess}</AlertDescription>
          </Alert>
        )}

        {debugMode && debugLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 p-4 rounded-md text-xs overflow-auto max-h-60">
                <ul className="space-y-1">
                  {debugLog.map((log, index) => (
                    <li key={index}>{log}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const org = getOrganization(params.id)
                    setDebugLog([...debugLog, `Current organization: ${JSON.stringify(org, null, 2)}`])
                  }}
                >
                  Inspect Organization
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDebugLog([])}>
                  Clear Log
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Azure Settings</TabsTrigger>
            <TabsTrigger value="sync">User Sync</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle>Azure AD Connection</CardTitle>
                  <CardDescription>Configure your Azure AD connection settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Azure AD Configuration</AlertTitle>
                    <AlertDescription>
                      <p className="mt-2">
                        To connect to Azure AD, you need to register an application in the Azure portal and grant it the
                        necessary permissions to read user data.
                      </p>
                      <ol className="list-decimal pl-5 space-y-1 mt-2">
                        <li>Go to the Azure Portal and navigate to Azure Active Directory</li>
                        <li>Go to App registrations and create a new registration</li>
                        <li>
                          Grant the application the following API permissions: User.Read.All (Application permission)
                        </li>
                        <li>Create a client secret and copy the value</li>
                        <li>Enter the Tenant ID, Client ID, and Client Secret below</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_connected" className="flex items-center gap-2">
                        Connection enabled
                      </Label>
                      <Switch
                        id="is_connected"
                        name="is_connected"
                        checked={settings.is_connected}
                        onCheckedChange={(checked) => handleToggleChange("is_connected", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant_id">Tenant ID (Directory ID)</Label>
                      <Input
                        id="tenant_id"
                        name="tenant_id"
                        placeholder="00000000-0000-0000-0000-000000000000"
                        value={settings.tenant_id}
                        onChange={handleChange}
                        required={settings.is_connected}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_id">Client ID (Application ID)</Label>
                      <Input
                        id="client_id"
                        name="client_id"
                        placeholder="00000000-0000-0000-0000-000000000000"
                        value={settings.client_id}
                        onChange={handleChange}
                        required={settings.is_connected}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_secret">Client Secret</Label>
                      <div className="relative">
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

                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-medium">Sync Options</h3>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="sync_disabled_users" className="flex items-center gap-2">
                          Sync disabled users
                        </Label>
                        <Switch
                          id="sync_disabled_users"
                          name="sync_disabled_users"
                          checked={settings.sync_disabled_users}
                          onCheckedChange={(checked) => handleToggleChange("sync_disabled_users", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto_provision" className="flex items-center gap-2">
                          Auto-provision new users
                        </Label>
                        <Switch
                          id="auto_provision"
                          name="auto_provision"
                          checked={settings.auto_provision}
                          onCheckedChange={(checked) => handleToggleChange("auto_provision", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="sync_groups" className="flex items-center gap-2">
                          Sync Azure AD groups
                        </Label>
                        <Switch
                          id="sync_groups"
                          name="sync_groups"
                          checked={settings.sync_groups}
                          onCheckedChange={(checked) => handleToggleChange("sync_groups", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="flex justify-end p-6 pt-0">
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
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>User Synchronization</CardTitle>
                <CardDescription>Sync users from Azure Active Directory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Last Sync</h3>
                      <p className="text-sm text-muted-foreground">
                        {settings.last_sync
                          ? new Date(settings.last_sync).toLocaleString()
                          : "No sync has been performed yet"}
                      </p>
                    </div>
                    <Button onClick={handleSync} disabled={isSyncing || !settings.is_connected}>
                      {isSyncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>

                  {!settings.is_connected && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Azure AD connection is not enabled. Please enable the connection in the Azure Settings tab.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-md border p-4">
                    <h3 className="font-medium mb-2">Sync Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Connection Status:</span>
                        <span
                          className={
                            settings.is_connected ? "text-green-600 font-medium" : "text-yellow-600 font-medium"
                          }
                        >
                          {settings.is_connected ? "Connected" : "Not Connected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sync Frequency:</span>
                        <span className="font-medium">
                          {settings.sync_frequency === "manual"
                            ? "Manual"
                            : settings.sync_frequency === "daily"
                              ? "Daily"
                              : "Weekly"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span className="font-medium">
                          {settings.last_sync ? new Date(settings.last_sync).toLocaleString() : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment">
            <Card>
              <CardHeader>
                <CardTitle>Signature Deployment</CardTitle>
                <CardDescription>Configure how signatures are deployed to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto_assign_signatures" className="flex items-center gap-2">
                      Auto-assign signatures to new users
                    </Label>
                    <Switch
                      id="auto_assign_signatures"
                      name="auto_assign_signatures"
                      checked={settings.auto_assign_signatures}
                      onCheckedChange={(checked) => handleToggleChange("auto_assign_signatures", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="server_side_deployment" className="flex items-center gap-2">
                      Enable server-side deployment
                    </Label>
                    <Switch
                      id="server_side_deployment"
                      name="server_side_deployment"
                      checked={settings.server_side_deployment}
                      onCheckedChange={(checked) => handleToggleChange("server_side_deployment", checked)}
                    />
                  </div>
                </div>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Server-Side Deployment</AlertTitle>
                  <AlertDescription>
                    <p className="mt-2">
                      Server-side deployment allows signatures to be automatically applied to all outgoing emails
                      without requiring user installation. This requires additional configuration in your Exchange
                      Online environment.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <div className="flex justify-end p-6 pt-0">
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
