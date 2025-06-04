"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Settings,
  Globe,
  Monitor,
  Mail,
} from "lucide-react"

interface SetupStep {
  id: number
  title: string
  description: string
  status: "pending" | "in-progress" | "completed" | "error"
  icon: any
}

export function ExchangeSetupWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 1,
      title: "Azure AD App Registration",
      description: "Create and configure Azure AD application",
      status: "in-progress",
      icon: Shield,
    },
    {
      id: 2,
      title: "API Permissions",
      description: "Grant required Exchange Online permissions",
      status: "pending",
      icon: Settings,
    },
    {
      id: 3,
      title: "Platform Configuration",
      description: "Configure credentials in the platform",
      status: "pending",
      icon: Globe,
    },
    {
      id: 4,
      title: "Connection Test",
      description: "Test connection to Exchange Online",
      status: "pending",
      icon: Monitor,
    },
    {
      id: 5,
      title: "Deploy Transport Rule",
      description: "Create email signature transport rule",
      status: "pending",
      icon: Mail,
    },
  ])

  const [azureConfig, setAzureConfig] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
  })

  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const progress = (steps.filter((s) => s.status === "completed").length / steps.length) * 100

  const updateStepStatus = (stepId: number, status: SetupStep["status"]) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess("Copied to clipboard!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to copy to clipboard")
    }
  }

  const validateStep1 = () => {
    // Mark step 1 as completed when user confirms they've created the app
    updateStepStatus(1, "completed")
    updateStepStatus(2, "in-progress")
    setCurrentStep(2)
  }

  const validateStep2 = () => {
    // Mark step 2 as completed when user confirms permissions are set
    updateStepStatus(2, "completed")
    updateStepStatus(3, "in-progress")
    setCurrentStep(3)
  }

  const saveConfiguration = async () => {
    if (!azureConfig.tenantId || !azureConfig.clientId || !azureConfig.clientSecret) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "saveConfig",
          config: azureConfig,
        }),
      })

      if (response.ok) {
        setSuccess("Configuration saved successfully!")
        updateStepStatus(3, "completed")
        updateStepStatus(4, "in-progress")
        setCurrentStep(4)
      } else {
        const result = await response.json()
        setError(result.error || "Failed to save configuration")
        updateStepStatus(3, "error")
      }
    } catch (error) {
      setError(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`)
      updateStepStatus(3, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)

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
        setSuccess("Successfully connected to Exchange Online!")
        updateStepStatus(4, "completed")
        updateStepStatus(5, "in-progress")
        setCurrentStep(5)
      } else {
        setError(result.error || result.message || "Failed to connect to Exchange Online")
        updateStepStatus(4, "error")
      }
    } catch (error) {
      setError(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`)
      updateStepStatus(4, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Exchange Online Setup Wizard</h1>
        <p className="text-muted-foreground">Let's configure your Exchange Online integration step by step</p>
        <div className="w-full max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(progress)}% Complete ({steps.filter((s) => s.status === "completed").length} of {steps.length}{" "}
            steps)
          </p>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
          <CardDescription>Track your progress through the Exchange Online configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.status === "completed"
                        ? "bg-green-500 text-white"
                        : step.status === "in-progress"
                          ? "bg-blue-500 text-white"
                          : step.status === "error"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.status === "error" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Badge
                    variant={
                      step.status === "completed"
                        ? "default"
                        : step.status === "in-progress"
                          ? "secondary"
                          : step.status === "error"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {step.status === "completed"
                      ? "Complete"
                      : step.status === "in-progress"
                        ? "In Progress"
                        : step.status === "error"
                          ? "Error"
                          : "Pending"}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Step 1: Create Azure AD App Registration
            </CardTitle>
            <CardDescription>
              First, we need to create an Azure AD application that will allow our platform to connect to Exchange
              Online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Before you start:</strong> Make sure you have Global Administrator or Application Administrator
                permissions in Azure AD.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Follow these steps:</h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Open Azure Portal</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Navigate to the Azure AD App Registrations page
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
                          "_blank",
                        )
                      }
                    >
                      Open Azure Portal <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Create New Registration</p>
                    <p className="text-sm text-muted-foreground">Click "New registration" button</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Configure Application</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Name:</strong> Email Signature Platform
                      </p>
                      <p>
                        <strong>Supported account types:</strong> Accounts in this organizational directory only (Single
                        tenant)
                      </p>
                      <p>
                        <strong>Redirect URI:</strong> Leave blank for now
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Copy Important Information</p>
                    <p className="text-sm text-muted-foreground">
                      After registration, copy the <strong>Application (client) ID</strong> and{" "}
                      <strong>Directory (tenant) ID</strong> from the Overview page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Keep the Azure portal open!</strong> You'll need it for the next step to configure API
                permissions.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={validateStep1}>
                I've Created the App Registration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Step 2: Configure API Permissions
            </CardTitle>
            <CardDescription>Grant the necessary permissions for Exchange Online access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Add API Permissions:</h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Navigate to API Permissions</p>
                    <p className="text-sm text-muted-foreground">
                      In your Azure AD app, click "API permissions" in the left sidebar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Add Microsoft Graph Permissions</p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Click "Add a permission" → "Microsoft Graph" → "Application permissions"</p>
                      <p>Add these permissions:</p>
                      <div className="bg-muted p-3 rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <code className="text-sm">Mail.ReadWrite</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard("Mail.ReadWrite")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <code className="text-sm">Organization.Read.All</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard("Organization.Read.All")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <code className="text-sm">User.Read.All</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard("User.Read.All")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-sm font-medium">
                    ⚠️
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-red-600">Grant Admin Consent</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Critical:</strong> Click "Grant admin consent for [Your Organization]" and confirm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Create Client Secret:</h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Navigate to Certificates & Secrets</p>
                    <p className="text-sm text-muted-foreground">Click "Certificates & secrets" in the left sidebar</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Create New Client Secret</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Click "New client secret"</p>
                      <p>
                        <strong>Description:</strong> Email Signature Platform
                      </p>
                      <p>
                        <strong>Expires:</strong> 24 months (recommended)
                      </p>
                    </div>
                  </div>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IMPORTANT:</strong> Copy the client secret value immediately! It will not be shown again
                    after you leave this page.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Previous Step
              </Button>
              <Button onClick={validateStep2}>
                Permissions Configured
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Step 3: Enter Configuration Details
            </CardTitle>
            <CardDescription>Enter the Azure AD credentials you copied from the previous steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID (Directory ID)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tenantId"
                    value={azureConfig.tenantId}
                    onChange={(e) => setAzureConfig((prev) => ({ ...prev, tenantId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(azureConfig.tenantId)}
                    disabled={!azureConfig.tenantId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Found in Azure AD → Overview → Directory (tenant) ID</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (Application ID)</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientId"
                    value={azureConfig.clientId}
                    onChange={(e) => setAzureConfig((prev) => ({ ...prev, clientId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(azureConfig.clientId)}
                    disabled={!azureConfig.clientId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Found in your app registration → Overview → Application (client) ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientSecret"
                    type={showSecret ? "text" : "password"}
                    value={azureConfig.clientSecret}
                    onChange={(e) => setAzureConfig((prev) => ({ ...prev, clientSecret: e.target.value }))}
                    placeholder="Enter the client secret you just created"
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">The secret value you copied from Certificates & secrets</p>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Security:</strong> These credentials are encrypted and stored securely. They are only used to
                authenticate with your Exchange Online environment.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Previous Step
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={isLoading || !azureConfig.tenantId || !azureConfig.clientId || !azureConfig.clientSecret}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Configuration
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              Step 4: Test Exchange Online Connection
            </CardTitle>
            <CardDescription>
              Verify that the platform can successfully connect to your Exchange Online environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ready to Test Connection</h3>
                <p className="text-muted-foreground">
                  Click the button below to test the connection to Exchange Online using your configured credentials.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">What this test will verify:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Azure AD authentication with your credentials
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Microsoft Graph API access permissions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Exchange Online connectivity
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Organization information retrieval
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button onClick={testConnection} disabled={isLoading} size="lg" className="px-8">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Monitor className="h-5 w-5 mr-2" />
                    Test Exchange Online Connection
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Previous Step
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                disabled={steps.find((s) => s.id === 4)?.status !== "completed"}
                variant="outline"
              >
                Skip to Final Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              Step 5: Setup Complete! 🎉
            </CardTitle>
            <CardDescription>
              Your Exchange Online integration is now configured and ready to deploy email signatures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Congratulations!</strong> Your Exchange Online connector is now live and ready to deploy email
                signatures across your organization.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">What you can do now:</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium">Create Signature Templates</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Design professional email signatures for your organization
                  </p>
                  <Button size="sm" asChild>
                    <a href="/org-admin/signatures/templates">Create Templates</a>
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium">Deploy Transport Rules</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically apply signatures to all outgoing emails
                  </p>
                  <Button size="sm" asChild>
                    <a href="/org-admin/signatures/transport-rules">Deploy Rules</a>
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium">Monitor Deployments</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Track signature deployment status and logs</p>
                  <Button size="sm" asChild>
                    <a href="/org-admin/signatures/deployment">View Logs</a>
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium">Manage Users</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Assign signatures to specific users or groups</p>
                  <Button size="sm" asChild>
                    <a href="/org-admin/users">Manage Users</a>
                  </Button>
                </Card>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" asChild>
                <a href="/org-admin/dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
