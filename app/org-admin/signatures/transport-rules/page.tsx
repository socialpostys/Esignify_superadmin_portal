"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, Copy, CheckCircle, AlertTriangle, Code } from "lucide-react"

export default function TransportRulesPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [userEmail, setUserEmail] = useState("support@sherborneqatar.org")
  const [powershellScript, setPowershellScript] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)
      try {
        // Get first organization from client storage
        const orgs = JSON.parse(localStorage.getItem("organizations") || "[]")
        if (orgs.length === 0) {
          throw new Error("No organizations found")
        }

        setOrganization(orgs[0])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (organization) {
      generatePowershellScript()
    }
  }, [organization, userEmail])

  const generatePowershellScript = () => {
    if (!organization) return

    // Find default template or use first template
    let templateId = ""
    let template = null

    if (organization.signature_templates && organization.signature_templates.length > 0) {
      // Find default template
      template = organization.signature_templates.find((t: any) => t.is_default)

      // If no default, use first template
      if (!template) {
        template = organization.signature_templates[0]
      }

      if (template) {
        templateId = template.id
      }
    }

    const script = `# PowerShell Script to Deploy Email Signature via Transport Rule
# This script creates a transport rule that automatically applies signatures to outgoing emails

# Check if ExchangeOnlineManagement module is installed
if (!(Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
    Write-Host "ExchangeOnlineManagement module not found. Installing..." -ForegroundColor Yellow
    Install-Module -Name ExchangeOnlineManagement -Force -AllowClobber
}

# Import the module
Import-Module ExchangeOnlineManagement

# Connect to Exchange Online
Write-Host "Connecting to Exchange Online..." -ForegroundColor Cyan
Connect-ExchangeOnline -ShowBanner:$false

try {
    # User email to apply the signature to
    $userEmail = "${userEmail}"
    
    # Signature HTML content
    $signatureHtml = @"
${template ? template.html_content : '<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #333333;"><p style="margin: 0;"><strong>Support Team</strong></p><p style="margin: 0;">Sherborne Qatar</p><p style="margin: 0;">Email: support@sherborneqatar.org</p><p style="margin: 0;">Website: <a href="https://sherborneqatar.org" style="color: #0066cc;">sherborneqatar.org</a></p></div>'}
"@
    
    # Process template with user data if available
    $user = $null
    ${
      organization.users && organization.users.length > 0
        ? `
    # Find the user
    foreach ($u in @(${JSON.stringify(organization.users)})) {
        if ($u.email -eq $userEmail) {
            $user = $u
            break
        }
    }
    
    if ($user) {
        # Replace placeholders with user data
        $signatureHtml = $signatureHtml -replace '{{name}}', $user.name
        $signatureHtml = $signatureHtml -replace '{{title}}', ($user.title -or "")
        $signatureHtml = $signatureHtml -replace '{{company}}', "${organization.name}"
        $signatureHtml = $signatureHtml -replace '{{email}}', $user.email
        $signatureHtml = $signatureHtml -replace '{{phone}}', ($user.phone -or "")
    } else {
        # Use default values if user not found
        $signatureHtml = $signatureHtml -replace '{{name}}', "Support Team"
        $signatureHtml = $signatureHtml -replace '{{title}}', "Support"
        $signatureHtml = $signatureHtml -replace '{{company}}', "${organization.name}"
        $signatureHtml = $signatureHtml -replace '{{email}}', "$userEmail"
        $signatureHtml = $signatureHtml -replace '{{phone}}', ""
    }`
        : ""
    }
    
    ${
      organization.logo_url
        ? `
    # Replace logo placeholder with actual logo URL
    $signatureHtml = $signatureHtml -replace '{{logo}}', "${organization.logo_url}"`
        : `
    # Remove the logo section if no logo is available
    $signatureHtml = $signatureHtml -replace '<img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />', ''`
    }
    
    # Check if a transport rule already exists for this user
    $existingRule = Get-TransportRule | Where-Object { $_.Name -like "*$userEmail*" }
    
    if ($existingRule) {
        Write-Host "Updating existing transport rule for $userEmail..." -ForegroundColor Cyan

        # Update the existing rule
        Set-TransportRule -Identity $existingRule.Identity \`
            -ApplyHtmlDisclaimerLocation 'Append' \`
            -ApplyHtmlDisclaimerText $signatureHtml \`
            -ApplyHtmlDisclaimerFallbackAction 'Wrap'

        Write-Host "Transport rule updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Creating new transport rule for $userEmail..." -ForegroundColor Cyan

        # Create a new transport rule
        New-TransportRule -Name "Add Signature - $userEmail" \`
            -FromScope "InOrganization" \`
            -SentToScope "NotInOrganization" \`
            -FromAddressContainsWords $userEmail \`
            -ApplyHtmlDisclaimerLocation "Append" \`
            -ApplyHtmlDisclaimerText $signatureHtml \`
            -ApplyHtmlDisclaimerFallbackAction "Wrap"

        Write-Host "Transport rule created successfully!" -ForegroundColor Green
    }
    
    Write-Host "Signature deployment completed for $userEmail" -ForegroundColor Green
    Write-Host "The signature will be automatically applied to all outgoing emails from this address" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    # Disconnect from Exchange Online
    Disconnect-ExchangeOnline -Confirm:$false
}`

    setPowershellScript(script)
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(powershellScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadScript = () => {
    const blob = new Blob([powershellScript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Deploy-Signature-TransportRule-${userEmail.split("@")[0]}.ps1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
            <h1 className="text-3xl font-bold tracking-tight">Server-Side Deployment</h1>
            <p className="text-muted-foreground">Deploy signatures using Exchange transport rules</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transport Rule Deployment</CardTitle>
            <CardDescription>
              Deploy signatures using Exchange transport rules for server-side application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                Transport rules apply signatures on the server side, ensuring they appear on all emails sent from the
                specified address, regardless of the device or email client used.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="relative">
                <Label htmlFor="powershellScript">PowerShell Script</Label>
                <Textarea
                  id="powershellScript"
                  value={powershellScript}
                  readOnly
                  className="font-mono text-sm h-[400px] resize-none mt-2"
                />
                <div className="absolute top-10 right-2 space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCopyScript}>
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadScript}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleDownloadScript}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Script
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
            <CardDescription>Follow these steps to deploy a signature using a transport rule</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Download the PowerShell script using the button above</li>
              <li>Open PowerShell as an administrator on your computer</li>
              <li>
                Run the command: <code className="bg-slate-100 px-1 rounded">Set-ExecutionPolicy RemoteSigned</code>
              </li>
              <li>Navigate to the folder where you saved the script</li>
              <li>
                Run the script:{" "}
                <code className="bg-slate-100 px-1 rounded">
                  .\Deploy-Signature-TransportRule-{userEmail.split("@")[0]}.ps1
                </code>
              </li>
              <li>Sign in with your Microsoft 365 admin credentials when prompted</li>
              <li>
                The script will create a transport rule that automatically applies the signature to all emails sent from{" "}
                {userEmail}
              </li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Server-Side vs. Client-Side Deployment</h3>
              <p className="text-blue-700 text-sm">
                <strong>Server-Side (Transport Rules):</strong> Signatures are applied automatically on the server as
                emails pass through Exchange. They work regardless of the device or email client used, ensuring
                consistency across all platforms.
              </p>
              <p className="text-blue-700 text-sm mt-2">
                <strong>Client-Side (Outlook Signatures):</strong> Signatures are stored locally on each user's device
                and applied by the email client. They require configuration on each device and may not be consistent
                across different platforms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
