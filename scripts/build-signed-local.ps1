# Build a locally-signed Windows installer using build/code-signing.pfx
# Usage: .\scripts\build-signed-local.ps1

$pfxPath = Join-Path $PSScriptRoot "..\build\code-signing.pfx"
$pfxPath = [System.IO.Path]::GetFullPath($pfxPath)

if (-not (Test-Path $pfxPath)) {
    Write-Error "code-signing.pfx not found at $pfxPath - run scripts/generate-cert.ps1 first"
    exit 1
}

$password = Read-Host -Prompt "PFX password" -AsSecureString
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$env:CSC_LINK = $pfxPath
$env:CSC_KEY_PASSWORD = $plain

Write-Host "Building signed Windows package..." -ForegroundColor Cyan
npm run build:win

# Clear sensitive env vars
Remove-Item Env:CSC_LINK -ErrorAction SilentlyContinue
Remove-Item Env:CSC_KEY_PASSWORD -ErrorAction SilentlyContinue
$plain = $null
