"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Copy, CheckCircle, AlertTriangle, Code } from "lucide-react"
import { getOrganization } from "@/lib/client-storage"

export default function ExportOrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [exportData, setExportData] = useState<string>("")
  const [powershellScript, setPowershellScript] = useState<string>("")
  const [singleUserScript, setSingleUserScript] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)
      try {
        // Get organization from client storage
        const org = getOrganization(params.id)
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

        setExportData(JSON.stringify([exportObj], null, 2))

        // Create PowerShell script
        const script = generatePowershellScript(org)
        setPowershellScript(script)

        // Create single user script
        const singleScript = generateSingleUserScript(org)
        setSingleUserScript(singleScript)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

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

# Create directory for organization data if it doesn't exist
$dataDir = "$env:APPDATA\\Signify"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

# Save organization data
$orgData = @'
${exportData}
'@

$orgData | Out-File -FilePath "$dataDir\\organizations.json" -Encoding utf8

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

# Get default template
$defaultTemplate = $null
foreach ($template in ${JSON.stringify(org.signature_templates || [])}) {
    if ($template.is_default) {
        $defaultTemplate = $template
        break
    }
}

if (!$defaultTemplate -and ${(org.signature_templates || []).length} -gt 0) {
    $defaultTemplate = ${JSON.stringify((org.signature_templates || [])[0])}
}

if (!$defaultTemplate) {
    Write-Host "No signature templates found. Exiting." -ForegroundColor Red
    exit
}

# Deploy to users
$successCount = 0
$failCount = 0

foreach ($user in ${JSON.stringify(org.users || [])}) {
    # Skip users without email
    if (!$user.email) {
        Write-Host "Skipping user without email: $($user.name)" -ForegroundColor Yellow
        continue
    }
    
    # Get template for this user
    $template = $defaultTemplate
    if ($user.signature_template_id) {
        foreach ($t in ${JSON.stringify(org.signature_templates || [])}) {
            if ($t.id -eq $user.signature_template_id) {
                $template = $t
                break
            }
        }
    }
    
    # Process template with user data
    $html = Process-Template -Template $template.html_content -User $user -Organization ${JSON.stringify(org)}
    
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

  const generateSingleUserScript = (org: any) => {
    return `# PowerShell Script to Deploy Email Signature to a Single User
# Usage: .\DeploySignatureToSingleUser.ps1 -UserEmail "user@example.com" -TemplateId "template-id"

param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail
)

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

# Create directory for organization data if it doesn't exist
$dataDir = "$env:APPDATA\\Signify"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

# Save organization data
$orgData = @'
${exportData}
'@

$orgData | Out-File -FilePath "$dataDir\\organizations.json" -Encoding utf8

try {
    # Get organization data
    $orgs = ConvertFrom-Json $orgData
    $org = $orgs[0]  # We only have one organization in the export
    
    # Find the user
    $user = $null
    foreach ($u in $org.users) {
        if ($u.email -eq $UserEmail) {
            $user = $u
            break
        }
    }
    
    if (!$user) {
        Write-Host "User $UserEmail not found in organization $($org.name)" -ForegroundColor Red
        exit 1
    }
    
    # Get default template
    $template = $null
    
    # If user has assigned template, use that
    if ($user.signature_template_id) {
        foreach ($t in $org.signature_templates) {
            if ($t.id -eq $user.signature_template_id) {
                $template = $t
                break
            }
        }
    }
    
    # If no template assigned, use default
    if (!$template) {
        foreach ($t in $org.signature_templates) {
            if ($t.is_default) {
                $template = $t
                break
            }
        }
    }
    
    # If still no template, use first one
    if (!$template -and $org.signature_templates.length -gt 0) {
        $template = $org.signature_templates[0]
    }
    
    if (!$template) {
        Write-Host "No signature templates found for organization $($org.name)" -ForegroundColor Red
        exit 1
    }
    
    # Process template with user data
    $html = $template.html_content
    
    # Replace placeholders with user data
    $html = $html -replace '{{name}}', $user.name
    $html = $html -replace '{{title}}', ($user.title -or "")
    $html = $html -replace '{{company}}', $org.name
    $html = $html -replace '{{email}}', $user.email
    $html = $html -replace '{{phone}}', ($user.phone -or "")
    
    # Replace logo placeholder with actual logo URL if available
    if ($org.logo_url) {
        $html = $html -replace '{{logo}}', $org.logo_url
    }
    else {
        # Remove the logo section if no logo is available
        $html = $html -replace '<img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />', ''
    }
    
    # Create a temporary file with the HTML content
    $tempFile = [System.IO.Path]::GetTempFileName() + ".html"
    $html | Out-File -FilePath $tempFile -Encoding utf8
    
    # Deploy the signature
    Write-Host "Deploying signature '$($template.name)' to $UserEmail..." -ForegroundColor Cyan
    
    # Get the mailbox
    $mailbox = Get-Mailbox -Identity $UserEmail -ErrorAction Stop
    
    # Create the signature
    Set-MailboxMessageConfiguration -Identity $UserEmail -SignatureHTML ([System.IO.File]::ReadAllText($tempFile)) -SignatureName $template.name
    
    # Set as default signature
    Set-MailboxMessageConfiguration -Identity $UserEmail -AutoAddSignature $true -DefaultFontName "Calibri" -DefaultFontSize 11
    
    # Clean up temp file
    Remove-Item $tempFile -Force
    
    Write-Host "Signature successfully deployed to $UserEmail" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Disconnect from Exchange Online
    Disconnect-ExchangeOnline -Confirm:$false
}
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

  const handleCopySingleUserScript = () => {
    navigator.clipboard.writeText(singleUserScript)
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

  const handleDownloadSingleUserScript = () => {
    const blob = new Blob([singleUserScript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Deploy-Signature-Single-User-${organization?.name.replace(/\s+/g, "-").toLowerCase()}.ps1`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/super-admin/organizations/${params.id}/signatures`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export & Deploy</h1>
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
          <Tabs defaultValue="single-user" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single-user">Single User Deployment</TabsTrigger>
              <TabsTrigger value="all-users">All Users Deployment</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="single-user" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deploy to a Single User</CardTitle>
                  <CardDescription>
                    This script will deploy a signature to a single user in Microsoft 365/Exchange
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
                    <Textarea value={singleUserScript} readOnly className="font-mono text-sm h-[400px] resize-none" />
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button size="sm" variant="outline" onClick={handleCopySingleUserScript}>
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadSingleUserScript}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleDownloadSingleUserScript}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Script
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>Follow these steps to deploy a signature to a single user</CardDescription>
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
                      Run the script with the user's email:{" "}
                      <code className="bg-slate-100 px-1 rounded">
                        .\Deploy-Signature-Single-User-{organization?.name.replace(/\s+/g, "-").toLowerCase()}.ps1
                        -UserEmail "user@example.com"
                      </code>
                    </li>
                    <li>Sign in with your Microsoft 365 admin credentials when prompted</li>
                    <li>The script will deploy the signature to the specified user</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all-users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deploy to All Users</CardTitle>
                  <CardDescription>
                    This script will deploy signatures to all users in Microsoft 365/Exchange
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
                  <CardDescription>Follow these steps to deploy signatures to all users</CardDescription>
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
