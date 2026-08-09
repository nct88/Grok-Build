#Requires -Version 5.1
<#
.SYNOPSIS
  Run Grok Build desktop (Electron). Finds Node/npm even when not on PATH.
#>
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

function Find-NodeBin {
  $dirs = @(
    "$env:LOCALAPPDATA\OpenAI\Codex\runtimes\cua_node\fb8898c05a62885e\bin",
    "$env:LOCALAPPDATA\OpenAI\Codex\runtimes\cua_node",
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\node",
    "$env:USERPROFILE\.local\bin"
  )
  foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { continue }
    $direct = Join-Path $d "node.exe"
    if (Test-Path $direct) {
      return (Split-Path $direct -Parent)
    }
    $found = Get-ChildItem -Path $d -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($found) {
      return $found.DirectoryName
    }
  }
  return $null
}

$bin = Find-NodeBin
if (-not $bin) {
  Write-Host @"
Node.js / npm not found.

Install Node 20+ LTS from https://nodejs.org
  (check "Add to PATH" during setup)

Or set GROK_NODE_BIN to a folder containing node.exe and npm.cmd
"@ -ForegroundColor Red
  exit 1
}

if ($env:GROK_NODE_BIN -and (Test-Path (Join-Path $env:GROK_NODE_BIN "node.exe"))) {
  $bin = $env:GROK_NODE_BIN
}

$env:PATH = "$bin;$env:PATH"
$node = Join-Path $bin "node.exe"
$npmCmd = Join-Path $bin "npm.cmd"
if (-not (Test-Path $npmCmd)) {
  $npmCmd = Join-Path $bin "npm"
}

Write-Host "Product root : $root"
Write-Host "Node         : $node"
& $node -v
if (Test-Path $npmCmd) {
  Write-Host "npm          : $npmCmd"
  & $npmCmd -v
} else {
  Write-Host "npm.cmd not found next to node.exe" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $root "node_modules"))) {
  Write-Host "npm install..."
  & $npmCmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}

Write-Host "Building packages..."
& $npmCmd run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "Starting Grok Build desktop..."
& $npmCmd run start -w @grok-build/desktop
exit $LASTEXITCODE
