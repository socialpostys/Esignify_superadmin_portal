# PowerShell Script to Deploy Email Signature to a Single User
# Usage: .\DeploySignatureToSingleUser.ps1 -UserEmail "user@example.com" -TemplateId "template-id" -OrganizationId "org-id"

param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail,
    
    [Parameter(Mandatory=$true)]
    [string]$TemplateId,
    
    [Parameter(Mandatory=$true)]
    [string]$OrganizationId
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

try {
    # Get organization data from local storage
    $orgDataPath = "$env:APPDATA\Signify\organizations.json"
    
    if (!(Test-Path $orgDataPath)) {
        Write-Host "Organization data not found at $orgDataPath" -ForegroundColor Red
        Write-Host "Please export your organization data first using the Export feature in the web interface" -ForegroundColor Yellow
        exit 1
    }
    
    # Load organization data
    $orgs = Get-Content $orgDataPath -Raw | ConvertFrom-Json
    $org = $orgs | Where-Object { $_.id -eq $OrganizationId }
    
    if (!$org) {
        Write-Host "Organization with ID $OrganizationId not found" -ForegroundColor Red
        exit 1
    }
    
    # Find the user
    $user = $org.users | Where-Object { $_.email -eq $UserEmail }
    
    if (!$user) {
        Write-Host "User $UserEmail not found in organization $($org.name)" -ForegroundColor Red
        exit 1
    }
    
    # Find the template
    $template = $org.signature_templates | Where-Object { $_.id -eq $TemplateId }
    
    if (!$template) {
        Write-Host "Template with ID $TemplateId not found" -ForegroundColor Red
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
    
    # Update user in local storage to mark template as assigned
    $user.signature_template_id = $TemplateId
    $user.signature_assigned_at = (Get-Date).ToString("o")
    
    # Save updated organization data
    $orgs | ConvertTo-Json -Depth 10 | Out-File -FilePath $orgDataPath -Encoding utf8
    
    Write-Host "User data updated in local storage" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Disconnect from Exchange Online
    Disconnect-ExchangeOnline -Confirm:$false
}
