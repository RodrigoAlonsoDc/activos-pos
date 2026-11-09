param (
    [int]$HttpPort = 8000,
    [int]$HttpsPort = 8443
)

$currentDir = $PSScriptRoot
if (-not $currentDir) { $currentDir = (Get-Location).Path }
$mainScript = Join-Path $currentDir "servidor_local.ps1"

& $mainScript -HttpPort $HttpPort -HttpsPort $HttpsPort
