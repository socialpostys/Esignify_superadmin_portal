# PowerShell Script to Deploy Email Signatures to Specific Users
# This script connects to Microsoft 365 and sets HTML signatures for specified users

param(
    [Parameter(Mandatory=$true)]
    [string]$UserEmail,
    
    [Parameter(Mandatory=$true)]
    [string]$SignatureHtml,
    
    [Parameter(Mandatory=$false)]
    [string]$SignatureName = "Company Signature",
    
    [Parameter(Mandatory=$false)]
    [switch]$SetAsDefault = $true
)

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

# Main script execution
try {
    # Connect to Exchange Online
    Connect-ExchangeOnline
    
    # Deploy the signature
    $result = Deploy-Signature -UserEmail $UserEmail -SignatureHtml $SignatureHtml -SignatureName $SignatureName -SetAsDefault $SetAsDefault
    
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
