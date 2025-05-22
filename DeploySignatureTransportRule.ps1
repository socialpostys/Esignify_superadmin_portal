# PowerShell Script to Deploy Email Signature via Transport Rule
# This script creates a transport rule that automatically applies signatures to outgoing emails

# Parameters
param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail = "support@sherborneqatar.org",
    
    [Parameter(Mandatory=$false)]
    [string]$OrganizationId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateId = ""
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
    # Get organization data from local storage or use provided HTML
    $signatureHtml = ""
    $templateName = "Sherborne Qatar Signature"
    
    # Check if we need to get the signature from local storage
    if ($OrganizationId -and $TemplateId) {
        $orgDataPath = "$env:APPDATA\Signify\organizations.json"
        
        if (Test-Path $orgDataPath) {
            # Load organization data
            $orgs = Get-Content $orgDataPath -Raw | ConvertFrom-Json
            $org = $orgs | Where-Object { $_.id -eq $OrganizationId }
            
            if ($org) {
                # Find the template
                $template = $org.signature_templates | Where-Object { $_.id -eq $TemplateId }
                
                if ($template) {
                    $signatureHtml = $template.html_content
                    $templateName = $template.name
                    
                    # Find the user
                    $user = $org.users | Where-Object { $_.email -eq $UserEmail }
                    
                    if ($user) {
                        # Replace placeholders with user data
                        $signatureHtml = $signatureHtml -replace '{{name}}', $user.name
                        $signatureHtml = $signatureHtml -replace '{{title}}', ($user.title -or "")
                        $signatureHtml = $signatureHtml -replace '{{company}}', $org.name
                        $signatureHtml = $signatureHtml -replace '{{email}}', $user.email
                        $signatureHtml = $signatureHtml -replace '{{phone}}', ($user.phone -or "")
                        
                        # Replace logo placeholder with actual logo URL if available
                        if ($org.logo_url) {
                            $signatureHtml = $signatureHtml -replace '{{logo}}', $org.logo_url
                        }
                        else {
                            # Remove the logo section if no logo is available
                            $signatureHtml = $signatureHtml -replace '<img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />', ''
                        }
                    }
                }
            }
        }
    }
    
    # If we couldn't get the signature from local storage, use a default one
    if (!$signatureHtml) {
        Write-Host "Using default signature template..." -ForegroundColor Yellow
        $signatureHtml = @"
<div style="font-family: Arial, sans-serif; font-size: 10pt; color: #333333;">
    <p style="margin: 0;"><strong>Support Team</strong></p>
    <p style="margin: 0;">Sherborne Qatar</p>
    <p style="margin: 0;">Email: support@sherborneqatar.org</p>
    <p style="margin: 0;">Website: <a href="https://sherborneqatar.org" style="color: #0066cc;">sherborneqatar.org</a></p>
    <p style="margin-top: 10px; font-size: 8pt; color: #666666;">This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed.</p>
</div>
"@
    }
    
    # Create a temporary file with the HTML content
    $tempFile = [System.IO.Path]::GetTempFileName() + ".html"
    $signatureHtml | Out-File -FilePath $tempFile -Encoding utf8
    
    # Read the HTML content
    $signatureHtmlContent = Get-Content -Path $tempFile -Raw
    
    # Check if a transport rule already exists for this user
    $existingRule = Get-TransportRule | Where-Object { $_.Name -like "*$UserEmail*" }
    
    if ($existingRule) {
        Write-Host "Updating existing transport rule for $UserEmail..." -ForegroundColor Cyan
        
        # Update the existing rule
        Set-TransportRule -Identity $existingRule.Identity `
            -ApplyHtmlDisclaimerLocation 'Append' `
            -ApplyHtmlDisclaimerText $signatureHtmlContent `
            -ApplyHtmlDisclaimerFallbackAction 'Wrap'
            
        Write-Host "Transport rule updated successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Creating new transport rule for $UserEmail..." -ForegroundColor Cyan
        
        # Create a new transport rule
        New-TransportRule -Name "Add Signature - $UserEmail" `
            -FromScope "InOrganization" `
            -SentToScope "NotInOrganization" `
            -FromAddressContainsWords $UserEmail `
            -ApplyHtmlDisclaimerLocation 'Append' `
            -ApplyHtmlDisclaimerText $signatureHtmlContent `
            -ApplyHtmlDisclaimerFallbackAction 'Wrap'
            
        Write-Host "Transport rule created successfully!" -ForegroundColor Green
    }
    
    # Clean up temp file
    Remove-Item $tempFile -Force
    
    Write-Host "Signature deployment completed for $UserEmail" -ForegroundColor Green
    Write-Host "The signature will be automatically applied to all outgoing emails from this address" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Disconnect from Exchange Online
    Disconnect-ExchangeOnline -Confirm:$false
}
