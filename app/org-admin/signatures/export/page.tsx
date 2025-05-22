"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Copy, CheckCircle, AlertTriangle, Code } from "lucide-react"
import Link from "next/link"

export default function ExportSignaturesPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [exportData, setExportData] = useState<string>("")
  const [powershellScript, setPowershellScript] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)
      try {
        // Get organization ID from localStorage
        const orgId = localStorage.getItem("currentOrganizationId")
        if (!orgId) {
          throw new Error("No organization selected")
        }

        // Get organization data from localStorage
        const orgsData = localStorage.getItem("organizations")
        if (!orgsData) {
          throw new Error("No organizations found")
        }

        const orgs = JSON.parse(orgsData)
        const org = orgs.find((o: any) => o.id === orgId)

        if (!org) {
          throw new Error("Organization not found")
        }

        setOrganization(org)

        // Create export data
        const exportObj = {
          id: org.id,
          name: org.name,
          domain: org.domain || "",
          logo_url: org.logo_url || "",
          users: org.users || [],
          signature_templates: org.signature_templates || [],
        }

        setExportData(JSON.stringify(exportObj, null, 2))

        // Create PowerShell script
        const script = generatePowershellScript(org)
        setPowershellScript(script)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const generatePowershellScript = (org: any) => {
    return `# PowerShell Script to Deploy Email Signatures for ${org.name}
# Generated on ${new Date().toLocaleString()}

# Save this file as DeploySignatures.ps1 and run it with PowerShell

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

# Function to deploy signature to a user
function Deploy-Signature {
    param(
        [string]$UserEmail,
        [string]$SignatureHtml,
        [string]$SignatureName,
        [bool]$SetAsDefault
    )
    
    try {
        # Get the mailbox
        $mailbox = Get-Mailbox -Identity $UserEmail -ErrorAction Stop
        
        # Create a temporary file with the HTML content
        $tempFile = [System.IO.Path]::GetTempFileName() + ".html"
        $SignatureHtml | Out-File -FilePath $tempFile -Encoding utf8
        
        # Set the signature using Set-MailboxMessageConfiguration
        Write-Host "Setting signature for $UserEmail..." -ForegroundColor Cyan
        
        # Create the signature
        Set-MailboxMessageConfiguration -Identity $UserEmail -SignatureHTML ([System.IO.File]::ReadAllText($tempFile)) -SignatureName $SignatureName
        
        # Set as default if specified
        if ($SetAsDefault) {
            Write-Host "Setting as default signature..." -ForegroundColor Cyan
            Set-MailboxMessageConfiguration -Identity $UserEmail -AutoAddSignature $true -DefaultFontName "Calibri" -DefaultFontSize 11
        }
        
        # Clean up temp file
        Remove-Item $tempFile -Force
        
        Write-Host "Signature successfully deployed to $UserEmail" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error deploying signature to $UserEmail : $_" -ForegroundColor Red
        return $false
    }
}

# Function to process template with user data
function Process-Template {
    param(
        [string]$Template,
        [object]$User,
        [object]$Organization
    )
    
    $html = $Template
    
    # Replace placeholders with user data
    $html = $html -replace '{{name}}', $User.name
    $html = $html -replace '{{title}}', ($User.title -or "")
    $html = $html -replace '{{company}}', $Organization.name
    $html = $html -replace '{{email}}', $User.email
    $html = $html -replace '{{phone}}', ($User.phone -or "")
    
    # Replace logo placeholder with actual logo URL if available
    if ($Organization.logo_url) {
        $html = $html -replace '{{logo}}', $Organization.logo_url
    }
    else {
        # Remove the logo section if no logo is available
        $html = $html -replace '<img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />', ''
    }
    
    return $html
}

# Deploy signatures to users
Write-Host "Starting signature deployment for ${org.name}..." -ForegroundColor Cyan

# Get templates
$templates = @(${JSON.stringify(org.signature_templates || [])})

# Get default template
$defaultTemplate = $null
foreach ($template in $templates) {
    if ($template.is_default -eq $true) {
        $defaultTemplate = $template
        break
    }
}

if (!$defaultTemplate -and $templates.Count -gt 0) {
    $defaultTemplate = $templates[0]
}

if (!$defaultTemplate) {
    Write-Host "No signature templates found. Exiting." -ForegroundColor Red
    exit
}

# Deploy to users
$successCount = 0
$failCount = 0

$users = @(${JSON.stringify(org.users || [])})
foreach ($user in $users) {
    # Skip users without email
    if (!$user.email) {
        Write-Host "Skipping user without email: $($user.name)" -ForegroundColor Yellow
        continue
    }
    
    # Get template for this user
    $template = $defaultTemplate
    if ($user.signature_template_id) {
        foreach ($t in $templates) {
            if ($t.id -eq $user.signature_template_id) {
                $template = $t
                break
            }
        }
    }
    
    # Process template with user data
    $html = Process-Template -Template $template.html_content -User $user -Organization @{
        name = "${org.name}"
        logo_url = "${org.logo_url || ""}"
    }
    
    # Deploy signature
    $result = Deploy-Signature -UserEmail $user.email -SignatureHtml $html -SignatureName $template.name -SetAsDefault $true
    
    if ($result) {
        $successCount++
    }
    else {
        $failCount++
    }
}

Write-Host "Deployment completed: $successCount successful, $failCount failed" -ForegroundColor Cyan

# Disconnect from Exchange Online
Disconnect-ExchangeOnline -Confirm:$false

Write-Host "Script completed." -ForegroundColor Green
`
  }

  const handleCopyData = () => {
    navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(powershellScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadData = () => {
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${organization?.name.replace(/\s+/g, "-").toLowerCase()}-signatures-export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadScript = () => {
    const blob = new Blob([powershellScript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Deploy-Signatures-${organization?.name.replace(/\s+/g, "-").toLowerCase()}.ps1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout userRole="org-admin" orgName={organization?.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/signatures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export Signatures</h1>
            <p className="text-muted-foreground">Export signature data and deployment scripts</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <Tabs defaultValue="script" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="script">PowerShell Script</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>PowerShell Deployment Script</CardTitle>
                  <CardDescription>
                    This script will deploy signatures to users in Microsoft 365/Exchange
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Code className="h-4 w-4" />
                    <AlertDescription>
                      Save this script as a .ps1 file and run it with PowerShell. You will need admin access to your
                      Microsoft 365 tenant.
                    </AlertDescription>
                  </Alert>

                  <div className="relative">
                    <Textarea value={powershellScript} readOnly className="font-mono text-sm h-[400px] resize-none" />
                    <div className="absolute top-2 right-2 space-x-2">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>Follow these steps to deploy signatures</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Download the PowerShell script using the button above</li>
                    <li>Open PowerShell as an administrator on your computer</li>
                    <li>
                      Run the command:{" "}
                      <code className="bg-slate-100 px-1 rounded">Set-ExecutionPolicy RemoteSigned</code>
                    </li>
                    <li>Navigate to the folder where you saved the script</li>
                    <li>
                      Run the script:{" "}
                      <code className="bg-slate-100 px-1 rounded">
                        .\Deploy-Signatures-{organization?.name.replace(/\s+/g, "-").toLowerCase()}.ps1
                      </code>
                    </li>
                    <li>Sign in with your Microsoft 365 admin credentials when prompted</li>
                    <li>The script will deploy signatures to all users in your organization</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Export Data</CardTitle>
                  <CardDescription>JSON data containing signatures and user information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea value={exportData} readOnly className="font-mono text-sm h-[400px] resize-none" />
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button size="sm" variant="outline" onClick={handleCopyData}>
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadData}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleDownloadData}>
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
