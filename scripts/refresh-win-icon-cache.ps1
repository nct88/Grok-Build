#Requires -Version 5.1
<#
.SYNOPSIS
  Refresh Windows shell icon cache after changing app icons (dev electron / GrokBuild-dev.exe).
  Close all Electron / Grok Build windows first.
#>
$ErrorActionPreference = "Continue"
Write-Host "Stopping Explorer to rebuild icon cache..."
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$cache = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Explorer"
Get-ChildItem $cache -Filter "iconcache*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem $cache -Filter "thumbcache_*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
# Rebuild
Start-Process explorer.exe
Write-Host "Done. Re-run: npm run desktop"
Write-Host "If taskbar still wrong: unpin any Grok/Electron pin, then re-pin after launch."
