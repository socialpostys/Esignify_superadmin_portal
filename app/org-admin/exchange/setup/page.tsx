"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Monitor,
  ExternalLink,
  RefreshCw,
  Play,
  Shield,
  Globe,
  Mail,
} from "lucide-react"

export default function ExchangeSetupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  // Azure AD Configuration
  const [azureConfig, setAzureConfig] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
  })

  // Test results
  const [testResults, setTestResults] = useState<any>(null)

  const steps = [
    {
      id: 1,
      title: "Azure AD App Registration",
      description: "Create and configure Azure AD application",
      icon: Shield,
    },
    {
      id: 2,
      title: "API Permissions",
      description: "Grant required Exchange Online permissions",
      icon: Settings,
    },
    {
      id: 3,
      title: "Platform Configuration",
      description: "Configure credentials in the platform",
      icon: Globe,
    },
    {
      id: 4,
      title: "Connection Test",
      description: "Test connection to Exchange Online",
      icon: Monitor,
    },
    {
      id: 5,
      title: "Deploy Transport Rule",
      description: "Create email signature transport rule",
      icon: Mail,
    },
  ]

  const testConnection = async () => {
    setIsLoading(true)
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
      setTestResults(result)

      if (response.ok && result.success) {
        setConnectionStatus("connected")
        setSuccess("Successfully connected to Exchange Online!")
        markStepComplete(4)
      } else {
        setConnectionStatus("disconnected")
        setError(result.error || result.message || "Failed to connect to Exchange Online")
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      setError(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const saveAzureConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(azureConfig),
      })

      if (response.ok) {
        setSuccess("Azure configuration saved successfully!")
        markStepComplete(3)
      } else {
        const result = await response.json()
        setError(result.error || "Failed to save Azure configuration")
      }
    } catch (error) {
      setError(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("Copied to clipboard!")
  }

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Online Setup</h1>
          <p className="text-muted-foreground">
            Configure Exchange Online connectors for live email signature deployment
          </p>
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

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Progress</CardTitle>
            <CardDescription>Follow these steps to configure Exchange Online integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id)
                const isCurrent = currentStep === step.id
                const Icon = step.icon

                let statusText = "Not Started"
                let statusColor = "text-gray-500"
                if (isCompleted) {
                  statusText = "Complete"
                  statusColor = "text-green-500"
                } else if (isCurrent) {
                  statusText = "In Progress"
                  statusColor = "text-blue-500"
                }

                return (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${isCurrent ? "text-blue-600" : ""}`}>{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={`step-${currentStep}`}
          onValueChange={(value) => setCurrentStep(Number.parseInt(value.split("-")[1]))}
        >
          <TabsList className="grid w-full grid-cols-5">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={`step-${step.id}`} disabled={step.id > currentStep + 1}>
                Step {step.id}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Step 1: Azure AD App Registration */}
          <TabsContent value="step-1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Step 1: Azure AD App Registration
                </CardTitle>
                <CardDescription>Create a new Azure AD application for Exchange Online access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Welcome to the Exchange Online Setup!</h2>
                  <p className="text-sm text-gray-500">
                    This wizard will guide you through the process of configuring your Exchange Online connection.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Go to{" "}
                      <a
                        href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Azure Portal - App Registrations <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Click "New registration"</li>
                    <li>
                      Enter application name: <code className="bg-muted px-1 rounded">Email Signature Platform</code>
                    </li>
                    <li>Select "Accounts in this organizational directory only" (Single tenant)</li>
                    <li>Leave Redirect URI blank for now</li>
                    <li>Click "Register"</li>
                    <li>Copy the Application (client) ID and Directory (tenant) ID</li>
                  </ol>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Important:</strong> Keep the Azure portal open - you'll need it for the next steps.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)}>
                    Next: Configure Permissions
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: API Permissions */}
          <TabsContent value="step-2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Step 2: Configure API Permissions
                </CardTitle>
                <CardDescription>Grant the required permissions for Exchange Online access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Add API Permissions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>In your Azure AD app, click "API permissions" in the left menu</li>
                    <li>Click "Add a permission"</li>
                    <li>Select "Microsoft Graph"</li>
                    <li>Choose "Application permissions"</li>
                    <li>
                      Add these permissions:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>
                          <code className="bg-muted px-1 rounded">Mail.ReadWrite</code> - Read and write mail
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">Organization.Read.All</code> - Read organization info
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">User.Read.All</code> - Read all users
                        </li>
                      </ul>
                    </li>
                    <li>Click "Add permissions"</li>
                    <li>
                      <strong>Important:</strong> Click "Grant admin consent for [Your Organization]"
                    </li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Create Client Secret:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click "Certificates & secrets" in the left menu</li>
                    <li>Click "New client secret"</li>
                    <li>
                      Enter description: <code className="bg-muted px-1 rounded">Email Signature Platform</code>
                    </li>
                    <li>Select expiration: "24 months" (recommended)</li>
                    <li>Click "Add"</li>
                    <li>
                      <strong>Important:</strong> Copy the secret value immediately (it won't be shown again)
                    </li>
                  </ol>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Critical:</strong> Copy the client secret value now! It will not be displayed again after
                    you leave this page.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>Next: Platform Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Platform Configuration */}
          <TabsContent value="step-3" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Step 3: Platform Configuration
                </CardTitle>
                <CardDescription>Enter your Azure AD credentials in the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID (Directory ID)</Label>
                    <Input
                      id="tenantId"
                      value={azureConfig.tenantId}
                      onChange={(e) => setAzureConfig((prev) => ({ ...prev, tenantId: e.target.value }))}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID (Application ID)</Label>
                    <Input
                      id="clientId"
                      value={azureConfig.clientId}
                      onChange={(e) => setAzureConfig((prev) => ({ ...prev, clientId: e.target.value }))}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={azureConfig.clientSecret}
                      onChange={(e) => setAzureConfig((prev) => ({ ...prev, clientSecret: e.target.value }))}
                      placeholder="Enter the client secret you copied"
                    />
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    These credentials are stored securely and encrypted. They are only used to connect to your Exchange
                    Online environment.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Previous
                  </Button>
                  <Button onClick={saveAzureConfig} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Connection Test */}
          <TabsContent value="step-4" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Step 4: Test Connection
                </CardTitle>
                <CardDescription>Verify the connection to Exchange Online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
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
                        <span className="text-red-700">Connection failed</span>
                      </>
                    )}
                    {connectionStatus === "unknown" && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-700">Connection not tested</span>
                      </>
                    )}
                  </div>
                  <Button onClick={testConnection} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResults && (
                  <div className="p-4 border rounded-lg bg-muted">
                    <h4 className="font-semibold mb-2">Test Results:</h4>
                    <pre className="text-sm overflow-auto">{JSON.stringify(testResults, null, 2)}</pre>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep(5)} disabled={connectionStatus !== "connected"}>
                    Next: Deploy Transport Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 5: Deploy Transport Rule */}
          <TabsContent value="step-5" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Step 5: Deploy Transport Rule
                </CardTitle>
                <CardDescription>Create the email signature transport rule in Exchange Online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Ready to Deploy!</strong> Your Exchange Online connection is configured and tested. You can
                    now deploy email signature transport rules.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-semibold">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to the Signatures section to create email signature templates</li>
                    <li>Use the Transport Rules page to deploy signatures to your organization</li>
                    <li>Monitor deployment status and logs</li>
                    <li>Test email signatures with your users</li>
                  </ol>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(4)}>
                    Previous
                  </Button>
                  <Button asChild>
                    <a href="/org-admin/signatures/transport-rules">Go to Transport Rules</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
