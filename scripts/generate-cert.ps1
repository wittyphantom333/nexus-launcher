# generate-cert.ps1
# Run this ONCE locally to create a self-signed code signing cert.
# It will output the base64 string you paste into GitHub Secrets as CSC_LINK.
#
# Usage:
#   .\scripts\generate-cert.ps1 -Password "YourStrongPassword"

param(
    [Parameter(Mandatory = $true)]
    [string]$Password,

    [string]$Subject = "CN=Nexus Launcher",
    [string]$OutFile = "$PSScriptRoot\..\build\code-signing.pfx"
)

$ErrorActionPreference = "Stop"

Write-Host "Generating self-signed code signing certificate..." -ForegroundColor Cyan

$cert = New-SelfSignedCertificate `
    -Subject $Subject `
    -Type CodeSigningCert `
    -KeyUsage DigitalSignature `
    -KeyAlgorithm RSA `
    -KeyLength 4096 `
    -HashAlgorithm SHA256 `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(5)

Write-Host "Certificate thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# Export PFX
$securePass = ConvertTo-SecureString $Password -AsPlainText -Force
$outPath = (Resolve-Path (Split-Path $OutFile -Parent)).Path + "\" + (Split-Path $OutFile -Leaf)
Export-PfxCertificate -Cert $cert -FilePath $outPath -Password $securePass | Out-Null

Write-Host "PFX saved to: $outPath" -ForegroundColor Green

# Output base64 for GitHub Secret
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($outPath))

Write-Host ""
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "  Add these two secrets to your GitHub repo:" -ForegroundColor Yellow
Write-Host "  Settings -> Secrets and variables -> Actions -> New secret" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret name:  CSC_LINK" -ForegroundColor Cyan
Write-Host "Secret value: (copied to clipboard)" -ForegroundColor Cyan
$base64 | Set-Clipboard
Write-Host ""
Write-Host "Secret name:  CSC_KEY_PASSWORD" -ForegroundColor Cyan
Write-Host "Secret value: $Password" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding the secrets, every 'git push vX.Y.Z' tag will" -ForegroundColor Green
Write-Host "produce a signed installer automatically via GitHub Actions." -ForegroundColor Green
