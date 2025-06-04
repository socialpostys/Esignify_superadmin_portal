"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Shield,
  Settings,
  Globe,
  Monitor,
  Mail,
  Clock,
  Users,
  Key,
  FileText,
  Download,
  Play,
  Zap,
  BookOpen,
  HelpCircle,
} from "lucide-react"

export default function ExchangeSetupGuidePage() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const prerequisites = [
    {
      title: "Azure AD Global Administrator",
      description: "Required to create app registrations and grant admin consent",
      icon: Shield,
      status: "required",
    },
    {
      title: "Exchange Online Administrator",
      description: "Needed to manage transport rules and mail flow",
      icon: Mail,
      status: "required",
    },
    {
      title: "Microsoft 365 Tenant",
      description: "Active Microsoft 365 subscription with Exchange Online",
      icon: Globe,
      status: "required",
    },
    {
      title: "Domain Verification",
      description: "Your organization's domain must be verified in Microsoft 365",
      icon: CheckCircle,
      status: "recommended",
    },
  ]

  const permissions = [
    {
      permission: "Mail.ReadWrite",
      type: "Application",
      description: "Allows the app to read and write mail in all mailboxes",
      required: true,
    },
    {
      permission: "Organization.Read.All",
      type: "Application",
      description: "Read organization information and settings",
      required: true,
    },
    {
      permission: "User.Read.All",
      type: "Application",
      description: "Read all users' profiles and organizational information",
      required: true,
    },
    {
      permission: "Directory.Read.All",
      type: "Application",
      description: "Read directory data (optional for enhanced features)",
      required: false,
    },
  ]

  const troubleshootingSteps = [
    {
      issue: "Authentication Failed",
      solution: "Verify Tenant ID, Client ID, and Client Secret are correct",
      details: "Double-check that you copied the values correctly from Azure AD",
    },
    {
      issue: "Permission Denied",
      solution: "Ensure admin consent has been granted for all required permissions",
      details: "Go to API permissions and click 'Grant admin consent'",
    },
    {
      issue: "Transport Rule Creation Failed",
      solution: "Check Exchange Online administrator permissions",
      details: "User must have Exchange administrator role or higher",
    },
    {
      issue: "Connection Timeout",
      solution: "Verify network connectivity and firewall settings",
      details: "Ensure outbound HTTPS (443) connections to Microsoft Graph are allowed",
    },
  ]

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Exchange Connector Setup Guide</h1>
          <p className="text-muted-foreground">
            Complete step-by-step guide to configure Exchange Online integration for automated email signature
            deployment
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/org-admin/exchange/setup">
              <Play className="h-4 w-4 mr-2" />
              Start Setup Wizard
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Azure Portal
            </a>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Print Guide
          </Button>
        </div>

        {copiedText && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Copied "{copiedText}" to clipboard!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
            <TabsTrigger value="azure-setup">Azure Setup</TabsTrigger>
            <TabsTrigger value="platform-config">Platform Config</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Setup Overview
                </CardTitle>
                <CardDescription>Understanding the Exchange Online integration process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What You'll Accomplish</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Create Azure AD application for secure authentication
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Configure Microsoft Graph API permissions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Establish secure connection to Exchange Online
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Enable automated email signature deployment
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Set up transport rules for organization-wide signatures
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Estimated Time</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Azure AD Setup</span>
                        </div>
                        <Badge variant="secondary">10-15 min</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Platform Configuration</span>
                        </div>
                        <Badge variant="secondary">5 min</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Testing & Validation</span>
                        </div>
                        <Badge variant="secondary">5 min</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Architecture Overview</h3>
                  <div className="bg-muted p-6 rounded-lg">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Globe className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-sm font-medium">Email Signature Platform</p>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Shield className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-sm font-medium">Azure AD</p>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Mail className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-sm font-medium">Exchange Online</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Secure authentication flow: Platform → Azure AD → Exchange Online
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prerequisites Tab */}
          <TabsContent value="prerequisites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Prerequisites Checklist
                </CardTitle>
                <CardDescription>Ensure you have the necessary permissions and access before starting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prerequisites.map((prereq, index) => {
                    const Icon = prereq.icon
                    return (
                      <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{prereq.title}</h3>
                            <Badge variant={prereq.status === "required" ? "destructive" : "secondary"}>
                              {prereq.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{prereq.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Important:</strong> If you don't have the required administrator permissions, contact your
                    IT administrator to complete this setup or grant you the necessary roles.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Permission Verification</h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Check Your Azure AD Role</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Go to{" "}
                          <a
                            href="https://portal.azure.com"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                            rel="noreferrer"
                          >
                            Azure Portal
                          </a>
                        </li>
                        <li>Navigate to Azure Active Directory → Users</li>
                        <li>Find your user account and check assigned roles</li>
                        <li>Verify you have "Global Administrator" or "Application Administrator" role</li>
                      </ol>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Check Your Exchange Online Role</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Go to{" "}
                          <a
                            href="https://admin.microsoft.com"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                            rel="noreferrer"
                          >
                            Microsoft 365 Admin Center
                          </a>
                        </li>
                        <li>Navigate to Users → Active users</li>
                        <li>Find your user and check assigned roles</li>
                        <li>Verify you have "Exchange Administrator" or "Global Administrator" role</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Azure Setup Tab */}
          <TabsContent value="azure-setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Azure AD Application Setup
                </CardTitle>
                <CardDescription>
                  Step-by-step instructions for creating and configuring your Azure AD application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Create App Registration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Create App Registration</h3>
                  </div>

                  <div className="ml-10 space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium mb-2">Navigate to Azure Portal</h4>
                      <div className="flex items-center gap-2">
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
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open App Registrations
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          or manually navigate to Azure AD → App registrations
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Registration Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Application Name</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-muted rounded text-sm">Email Signature Platform</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard("Email Signature Platform", "Application Name")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Supported Account Types</Label>
                          <div className="p-2 bg-muted rounded text-sm">
                            Accounts in this organizational directory only (Single tenant)
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Redirect URI</Label>
                          <div className="p-2 bg-muted rounded text-sm text-muted-foreground">Leave blank for now</div>
                        </div>
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        After clicking "Register", copy the <strong>Application (client) ID</strong> and{" "}
                        <strong>Directory (tenant) ID</strong> from the Overview page. You'll need these later.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* Step 2: Configure API Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Configure API Permissions</h3>
                  </div>

                  <div className="ml-10 space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Required Microsoft Graph Permissions</h4>
                      <div className="space-y-2">
                        {permissions.map((perm, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono">{perm.permission}</code>
                                <Badge variant={perm.required ? "destructive" : "secondary"}>{perm.type}</Badge>
                                {perm.required && <Badge variant="outline">Required</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(perm.permission, `Permission: ${perm.permission}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Permission Setup Steps
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>In your app registration, click "API permissions" in the left menu</li>
                        <li>Click "Add a permission" → "Microsoft Graph" → "Application permissions"</li>
                        <li>Search for and add each required permission listed above</li>
                        <li>Click "Add permissions" after selecting all required permissions</li>
                        <li>
                          <strong>Critical:</strong> Click "Grant admin consent for [Your Organization]"
                        </li>
                      </ol>
                    </div>

                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Admin Consent Required:</strong> You must grant admin consent for all permissions.
                        Without this, the application will not be able to access Exchange Online.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* Step 3: Create Client Secret */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Create Client Secret</h3>
                  </div>

                  <div className="ml-10 space-y-4">
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <h4 className="font-medium mb-2">Client Secret Configuration</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Click "Certificates & secrets" in the left menu</li>
                        <li>Click "New client secret"</li>
                        <li>
                          Enter description: <code className="bg-white px-1 rounded">Email Signature Platform</code>
                        </li>
                        <li>
                          Select expiration: <strong>24 months</strong> (recommended)
                        </li>
                        <li>Click "Add"</li>
                        <li>
                          <strong>Immediately copy the secret value</strong> - it won't be shown again!
                        </li>
                      </ol>
                    </div>

                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Critical:</strong> Copy the client secret value immediately after creation. This value
                        is only displayed once and cannot be retrieved later. If you lose it, you'll need to create a
                        new secret.
                      </AlertDescription>
                    </Alert>

                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Information to Collect
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Make sure you have copied these three values:
                      </p>
                      <ul className="space-y-1 text-sm">
                        <li>
                          ✅ <strong>Tenant ID</strong> (Directory ID) - from Overview page
                        </li>
                        <li>
                          ✅ <strong>Client ID</strong> (Application ID) - from Overview page
                        </li>
                        <li>
                          ✅ <strong>Client Secret</strong> - from Certificates & secrets page
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Configuration Tab */}
          <TabsContent value="platform-config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>Configure the Email Signature Platform with your Azure AD credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration Steps</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Access Configuration Page</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Navigate to the Exchange setup page in your organization admin dashboard
                        </p>
                        <Button size="sm" asChild>
                          <a href="/org-admin/exchange/setup">
                            <Settings className="h-3 w-3 mr-1" />
                            Open Setup Page
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Enter Azure AD Credentials</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Input the three values you copied from Azure AD:
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-muted-foreground">Tenant ID:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-muted-foreground">Client ID:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-20 text-muted-foreground">Secret:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">••••••••••••••••••••••••••••••••</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Save Configuration</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Save Configuration" to securely store your credentials. The platform will encrypt and
                          store these credentials for secure access to Exchange Online.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Security:</strong> All credentials are encrypted using industry-standard encryption before
                    being stored. They are only used to authenticate with Microsoft Graph API and are never exposed in
                    logs or user interfaces.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Validation Checklist</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Tenant ID is a valid GUID format</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Client ID is a valid GUID format</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Client Secret is not empty and properly copied</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>All required API permissions have been granted</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Admin consent has been provided</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Connection Testing & Validation
                </CardTitle>
                <CardDescription>Verify your Exchange Online connection and test signature deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Connection Test</h3>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-2">What the test validates:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Azure AD authentication with your credentials</li>
                      <li>• Microsoft Graph API access permissions</li>
                      <li>• Exchange Online service connectivity</li>
                      <li>• Organization information retrieval</li>
                      <li>• Transport rule management capabilities</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Test Results Interpretation</h4>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-800">Success</h5>
                          <p className="text-sm text-green-700">
                            Connection established successfully. You can proceed to deploy email signatures.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-red-800">Authentication Failed</h5>
                          <p className="text-sm text-red-700">
                            Check your Tenant ID, Client ID, and Client Secret. Ensure they are copied correctly from
                            Azure AD.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-yellow-800">Permission Denied</h5>
                          <p className="text-sm text-yellow-700">
                            Admin consent may not be granted. Return to Azure AD and grant admin consent for all
                            permissions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Post-Connection Setup</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium">Create Signature Templates</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Design professional email signatures for your organization
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <a href="/org-admin/signatures/templates">Create Templates</a>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium">Deploy Transport Rules</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically apply signatures to outgoing emails
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <a href="/org-admin/signatures/transport-rules">Deploy Rules</a>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium">Manage User Assignments</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Assign specific signatures to users or groups
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <a href="/org-admin/users/assign">Assign Signatures</a>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Monitor className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium">Monitor Deployments</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Track deployment status and view logs</p>
                      <Button size="sm" variant="outline" asChild>
                        <a href="/org-admin/signatures/deployment">View Logs</a>
                      </Button>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshooting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Troubleshooting Guide
                </CardTitle>
                <CardDescription>Common issues and their solutions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Common Issues</h3>

                  <div className="space-y-4">
                    {troubleshootingSteps.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-600 mb-1">{item.issue}</h4>
                            <p className="text-sm font-medium mb-2">{item.solution}</p>
                            <p className="text-sm text-muted-foreground">{item.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Advanced Troubleshooting</h3>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Check Azure AD Logs</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Go to Azure Portal → Azure Active Directory → Sign-in logs</li>
                        <li>Filter by your application name "Email Signature Platform"</li>
                        <li>Look for failed authentication attempts and error details</li>
                        <li>Check the failure reason and correlation ID for support</li>
                      </ol>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Verify Network Connectivity</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Ensure outbound HTTPS (port 443) access to *.microsoftonline.com</li>
                        <li>Verify access to graph.microsoft.com</li>
                        <li>Check corporate firewall and proxy settings</li>
                        <li>Test from a different network if possible</li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Validate Permissions</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Return to Azure AD → App registrations → Your app</li>
                        <li>Go to API permissions and verify all required permissions are listed</li>
                        <li>Check that admin consent status shows "Granted for [Organization]"</li>
                        <li>If not granted, click "Grant admin consent" again</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Need Help?</strong> If you're still experiencing issues after following this guide, contact
                    our support team with your organization details and any error messages you're seeing.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
