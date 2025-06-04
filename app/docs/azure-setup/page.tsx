"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, AlertTriangle, CheckCircle, Copy, ExternalLink, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AzureSetupGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Azure AD Setup Guide</h1>
          <p className="text-muted-foreground mt-2">
            Complete guide for setting up Azure Active Directory integration for your organization
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Multi-Tenant Architecture</AlertTitle>
          <AlertDescription>
            Each organization must create their own Azure AD app registration in their own tenant. This ensures complete
            security isolation between organizations.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Prerequisites
              </CardTitle>
              <CardDescription>What you need before starting the setup process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Required Permissions:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Global Administrator or Application Administrator role in Azure AD</li>
                  <li>Permission to create app registrations in your Azure AD tenant</li>
                  <li>Permission to grant admin consent for API permissions</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Required Information:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Your organization's Azure AD tenant ID</li>
                  <li>Access to the Azure Portal (portal.azure.com)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Create App Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Step 1</Badge>
                Create Azure AD App Registration
              </CardTitle>
              <CardDescription>Register a new application in your organization's Azure AD tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3 text-sm">
                <li>
                  <strong>Navigate to Azure Portal:</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://portal.azure.com</code>
                    <Button variant="ghost" size="sm" onClick={() => window.open("https://portal.azure.com", "_blank")}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </li>

                <li>
                  <strong>Go to Azure Active Directory:</strong>
                  <div className="mt-1">Navigate to Azure Active Directory → App registrations</div>
                </li>

                <li>
                  <strong>Create New Registration:</strong>
                  <div className="mt-1">Click "New registration" button</div>
                </li>

                <li>
                  <strong>Configure Application:</strong>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Name:</strong>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          Email Signature Platform - [Your Organization Name]
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard("Email Signature Platform - [Your Organization Name]")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <strong>Supported account types:</strong> Accounts in this organizational directory only
                    </div>
                    <div>
                      <strong>Redirect URI:</strong> Leave blank for now
                    </div>
                  </div>
                </li>

                <li>
                  <strong>Register:</strong> Click "Register" to create the application
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 2: Configure API Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Step 2</Badge>
                Configure API Permissions
              </CardTitle>
              <CardDescription>Grant the necessary permissions to read user data from Azure AD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3 text-sm">
                <li>
                  <strong>Navigate to API Permissions:</strong>
                  <div className="mt-1">In your app registration, go to "API permissions"</div>
                </li>

                <li>
                  <strong>Add Microsoft Graph Permissions:</strong>
                  <div className="mt-1">Click "Add a permission" → "Microsoft Graph" → "Application permissions"</div>
                </li>

                <li>
                  <strong>Select Required Permissions:</strong>
                  <div className="mt-2 space-y-2">
                    <div className="border rounded-lg p-3">
                      <h5 className="font-medium mb-2">Required Permissions:</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <code className="text-xs">User.Read.All</code>
                          <span className="text-xs text-muted-foreground">Read all user profiles</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <code className="text-xs">Group.Read.All</code>
                          <span className="text-xs text-muted-foreground">Read all groups</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <code className="text-xs">Directory.Read.All</code>
                          <span className="text-xs text-muted-foreground">Read directory data</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <strong>Grant Admin Consent:</strong>
                  <div className="mt-1">
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Click "Grant admin consent for [Your Organization]" - This requires Global Administrator
                        privileges
                      </AlertDescription>
                    </Alert>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 3: Create Client Secret */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Step 3</Badge>
                Create Client Secret
              </CardTitle>
              <CardDescription>Generate a secret for secure authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3 text-sm">
                <li>
                  <strong>Navigate to Certificates & Secrets:</strong>
                  <div className="mt-1">In your app registration, go to "Certificates & secrets"</div>
                </li>

                <li>
                  <strong>Create New Secret:</strong>
                  <div className="mt-1">Click "New client secret"</div>
                </li>

                <li>
                  <strong>Configure Secret:</strong>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Description:</strong>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">Email Signature Platform Secret</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard("Email Signature Platform Secret")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <strong>Expires:</strong> 24 months (recommended)
                    </div>
                  </div>
                </li>

                <li>
                  <strong>Copy Secret Value:</strong>
                  <div className="mt-1">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> Copy the secret value immediately after creation. You won't be able
                        to see it again!
                      </AlertDescription>
                    </Alert>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 4: Collect Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Step 4</Badge>
                Collect Required Information
              </CardTitle>
              <CardDescription>Gather the credentials needed for the Email Signature Platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">From your App Registration Overview page:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>
                        <strong>Directory (tenant) ID:</strong>
                      </span>
                      <span className="text-muted-foreground">Found in Overview section</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>
                        <strong>Application (client) ID:</strong>
                      </span>
                      <span className="text-muted-foreground">Found in Overview section</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>
                        <strong>Client secret:</strong>
                      </span>
                      <span className="text-muted-foreground">From Step 3 above</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Configure in Platform */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Step 5</Badge>
                Configure in Email Signature Platform
              </CardTitle>
              <CardDescription>Enter your Azure AD credentials in the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3 text-sm">
                <li>
                  <strong>Navigate to Azure Settings:</strong>
                  <div className="mt-1">Go to Organization Admin → Azure AD Integration</div>
                </li>

                <li>
                  <strong>Enter Credentials:</strong>
                  <div className="mt-1">Fill in the Tenant ID, Client ID, and Client Secret from Step 4</div>
                </li>

                <li>
                  <strong>Enable Connection:</strong>
                  <div className="mt-1">Toggle "Connection enabled" to activate the integration</div>
                </li>

                <li>
                  <strong>Test Connection:</strong>
                  <div className="mt-1">Click "Test Connection" to verify the setup</div>
                </li>

                <li>
                  <strong>Sync Users:</strong>
                  <div className="mt-1">Go to the "User Sync" tab and click "Sync Now" to import users</div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Security Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Tenant Isolation:</strong> Each organization uses their own Azure AD tenant, ensuring
                    complete security isolation
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Minimal Permissions:</strong> Only read permissions are requested, no write access to your
                    Azure AD
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Secret Rotation:</strong> Client secrets expire after 24 months. Set a calendar reminder to
                    renew before expiration
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Audit Logs:</strong> All API calls are logged in Azure AD audit logs for security monitoring
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Error: "Insufficient privileges to complete the operation"</strong>
                  <div className="mt-1 text-muted-foreground">
                    Solution: Ensure admin consent has been granted for all required permissions
                  </div>
                </div>

                <div>
                  <strong>Error: "Invalid client secret"</strong>
                  <div className="mt-1 text-muted-foreground">
                    Solution: Generate a new client secret and update the platform configuration
                  </div>
                </div>

                <div>
                  <strong>Error: "Application not found in tenant"</strong>
                  <div className="mt-1 text-muted-foreground">
                    Solution: Verify the Tenant ID and Client ID are correct
                  </div>
                </div>

                <div>
                  <strong>No users returned from sync</strong>
                  <div className="mt-1 text-muted-foreground">
                    Solution: Check that users have email addresses and are not external guests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
