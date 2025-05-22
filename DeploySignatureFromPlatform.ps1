# PowerShell Script to Deploy Email Signatures from the Signify Platform
# This script fetches signature data from our platform and deploys it to Microsoft 365

param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail,
    
    [Parameter(Mandatory=$false)]
    [string]$OrganizationId,
    
    [Parameter(Mandatory=$false)]
    [string]$TemplateId,
    
    [Parameter(Mandatory=$false)]
    [switch]$SetAsDefault = $true
)

# Function to get user data and signature template
function Get-UserSignature {
    param(
        [string]$UserEmail,
        [string]$OrganizationId,
        [string]$TemplateId
    )
    
    try {
        # In a real implementation, this would call your API
        # For now, we'll simulate by reading from a local JSON file
        
        Write-Host "Fetching user data and signature template..." -ForegroundColor Cyan
        
        # Check if we have a local JSON file with organization data
        $orgDataPath = "$env:APPDATA\Signify\organizations.json"
        
        if (!(Test-Path $orgDataPath)) {
            Write-Host "Organization data not found. Please export your organization data first." -ForegroundColor Red
            return $null
        }
        
        # Load organization data
        $orgData = Get-Content $orgDataPath -Raw | ConvertFrom-Json
        
        # Find the organization
        if (!$OrganizationId) {
            # Try to find organization by user email domain
            $domain = $UserEmail.Split('@')[1]
            $organization = $orgData | Where-Object { $_.domain -eq $domain }
            
            if (!$organization) {
                Write-Host "Could not find organization for domain $domain" -ForegroundColor Red
                return $null
            }
            
            $OrganizationId = $organization.id
        }
        else {
            $organization = $orgData | Where-Object { $_.id -eq $OrganizationId }
            
            if (!$organization) {
                Write-Host "Organization with ID $OrganizationId not found" -ForegroundColor Red
                return $null
            }
        }
        
        # Find the user
        $user = $organization.users | Where-Object { $_.email -eq $UserEmail }
        
        if (!$user) {
            Write-Host "User $UserEmail not found in organization $($organization.name)" -ForegroundColor Red
            return $null
        }
        
        # Find the template
        if (!$TemplateId) {
            if ($user.signature_template_id) {
                $TemplateId = $user.signature_template_id
            }
            else {
                # Try to find default template
                $template = $organization.signature_templates | Where-Object { $_.is_default -eq $true }
                
                if (!$template) {
                    # Just take the first template
                    $template = $organization.signature_templates | Select-Object -First 1
                }
                
                if (!$template) {
                    Write-Host "No signature template found for organization $($organization.name)" -ForegroundColor Red
                    return $null
                }
                
                $TemplateId = $template.id
            }
        }
        
        $template = $organization.signature_templates | Where-Object { $_.id -eq $TemplateId }
        
        if (!$template) {
            Write-Host "Template with ID $TemplateId not found" -ForegroundColor Red
            return $null
        }
        
        # Process the template with user data
        $htmlContent = $template.html_content
        
        # Replace placeholders with user data
        $htmlContent = $htmlContent -replace '{{name}}', $user.name
        $htmlContent = $htmlContent -replace '{{title}}', $user.title
        $htmlContent = $htmlContent -replace '{{company}}', $organization.name
        $htmlContent = $htmlContent -replace '{{email}}', $user.email
        $htmlContent = $htmlContent -replace '{{phone}}', $user.phone
        
        # Replace logo placeholder with actual logo URL if available
        if ($organization.logo_url) {
            $htmlContent = $htmlContent -replace '{{logo}}', $organization.logo_url
        }
        else {
            # Remove the logo section if no logo is available
            $htmlContent = $htmlContent -replace '<img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />', ''
        }
        
        return @{
            UserEmail = $UserEmail
            SignatureHtml = $htmlContent
            SignatureName = $template.name
        }
    }
    catch {
        Write-Host "Error getting user signature: $_" -ForegroundColor Red
        return $null
    }
}

# Function to connect to Exchange Online
function Connect-ExchangeOnline {
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
}

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

# Function to export organization data from the platform
function Export-OrganizationData {
    param(
        [string]$OrganizationId
    )
    
    try {
        # In a real implementation, this would call your API
        # For now, we'll simulate by reading from localStorage in a browser
        
        Write-Host "This function would export organization data from the platform." -ForegroundColor Yellow
        Write-Host "For now, please use the 'Export Organization Data' button in the platform." -ForegroundColor Yellow
        
        return $false
    }
    catch {
        Write-Host "Error exporting organization data: $_" -ForegroundColor Red
        return $false
    }
}

# Main script execution
try {
    # Get the user signature
    $signatureData = Get-UserSignature -UserEmail $UserEmail -OrganizationId $OrganizationId -TemplateId $TemplateId
    
    if (!$signatureData) {
        Write-Host "Failed to get signature data. Exiting." -ForegroundColor Red
        exit 1
    }
    
    # Connect to Exchange Online
    Connect-ExchangeOnline
    
    # Deploy the signature
    $result = Deploy-Signature -UserEmail $signatureData.UserEmail -SignatureHtml $signatureData.SignatureHtml -SignatureName $signatureData.SignatureName -SetAsDefault $SetAsDefault
    
    if ($result) {
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Deployment failed." -ForegroundColor Red
    }
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
}
finally {
    # Disconnect from Exchange Online
    Disconnect-ExchangeOnline -Confirm:$false
}
