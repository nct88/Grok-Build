#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

Add-Type -AssemblyName System.Drawing

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

$source = Join-Path $root 'logo\fluffy-grok-master.png'
$whiteLeftReference = Join-Path $root 'logo\fluffy-grok-white-left-source.png'
$masterPath = Join-Path $root 'logo\processed\app-icon-master.png'
$iconPath = Join-Path $root 'apps\desktop\build\icon.ico'
$buildPng = Join-Path $root 'apps\desktop\build\icon.png'
$rendererPng = Join-Path $root 'apps\desktop\renderer\assets\logo.png'
foreach ($path in @($source, $whiteLeftReference, $masterPath, $iconPath, $buildPng, $rendererPng)) {
  Assert-True (Test-Path -LiteralPath $path) "Missing brand asset: $path"
}

foreach ($size in @(16, 20, 24, 32, 40, 48, 64, 128, 256, 512)) {
  $path = Join-Path $root "logo\processed\icon-$size.png"
  Assert-True (Test-Path -LiteralPath $path) "Missing processed icon-$size.png"
  $image = [System.Drawing.Image]::FromFile($path)
  try { Assert-True ($image.Width -eq $size -and $image.Height -eq $size) "Invalid icon-$size.png dimensions." }
  finally { $image.Dispose() }
}

Assert-True ((Get-Sha256 $buildPng) -eq (Get-Sha256 $rendererPng)) 'Renderer/About logo is not synchronized with build/icon.png.'
Assert-True ((Get-Sha256 $source) -ne (Get-Sha256 $whiteLeftReference)) 'Desktop and IDE-direction brand masters must remain visually distinct.'
$icoBytes = [System.IO.File]::ReadAllBytes($iconPath)
Assert-True ($icoBytes.Length -gt 100000) 'Desktop ICO is unexpectedly small.'
Assert-True ([BitConverter]::ToUInt16($icoBytes, 4) -eq 9) 'Desktop ICO must contain 9 DPI frames.'

$master = [System.Drawing.Bitmap]::FromFile($masterPath)
try {
  Assert-True ($master.PixelFormat -eq [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) 'Processed master must be 32-bit ARGB.'
  Assert-True ($master.GetPixel(0, 0).A -eq 0 -and $master.GetPixel($master.Width - 1, $master.Height - 1).A -eq 0) 'Processed master corners must be transparent.'
  $leftBlack = 0
  $rightWhite = 0
  $greenSpill = 0
  for ($y = 0; $y -lt $master.Height; $y += 3) {
    for ($x = 0; $x -lt $master.Width; $x += 3) {
      $pixel = $master.GetPixel($x, $y)
      if ($pixel.A -gt 200 -and $x -lt ($master.Width / 2) -and $pixel.R -lt 30 -and $pixel.G -lt 30 -and $pixel.B -lt 30) { $leftBlack++ }
      if ($pixel.A -gt 200 -and $x -ge ($master.Width / 2) -and $pixel.R -gt 225 -and $pixel.G -gt 225 -and $pixel.B -gt 225) { $rightWhite++ }
      if ($pixel.A -gt 40 -and $pixel.G -gt 120 -and $pixel.G -gt ($pixel.R * 1.5) -and $pixel.G -gt ($pixel.B * 1.5)) { $greenSpill++ }
    }
  }
  Assert-True ($leftBlack -gt 10000) "Black left Fluffy coverage is too low: $leftBlack"
  Assert-True ($rightWhite -gt 10000) "White right Fluffy coverage is too low: $rightWhite"
  Assert-True ($greenSpill -lt 200) "Chroma spill remains in Desktop master: $greenSpill sampled pixels"
} finally {
  $master.Dispose()
}

$reference = [System.Drawing.Bitmap]::FromFile($whiteLeftReference)
try {
  $referenceLeftWhite = 0
  $referenceRightBlack = 0
  for ($y = 0; $y -lt $reference.Height; $y += 4) {
    for ($x = 0; $x -lt $reference.Width; $x += 4) {
      $pixel = $reference.GetPixel($x, $y)
      if ($pixel.A -gt 200 -and $x -lt ($reference.Width / 2) -and $pixel.R -gt 225 -and $pixel.G -gt 225 -and $pixel.B -gt 225) { $referenceLeftWhite++ }
      if ($pixel.A -gt 200 -and $x -ge ($reference.Width / 2) -and $pixel.R -lt 30 -and $pixel.G -lt 30 -and $pixel.B -lt 30) { $referenceRightBlack++ }
    }
  }
  Assert-True ($referenceLeftWhite -gt 5000) "IDE-direction reference lost white-left coverage: $referenceLeftWhite"
  Assert-True ($referenceRightBlack -gt 5000) "IDE-direction reference lost black-right coverage: $referenceRightBlack"
} finally {
  $reference.Dispose()
}

Write-Host 'Desktop brand assets OK: black-left/white-right Fluffy master, inverse lettering, transparent alpha, 10 PNG sizes, 9-frame ICO, renderer/build synchronization.'
