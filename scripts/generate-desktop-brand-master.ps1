#Requires -Version 5.1
param(
  [string]$SourcePath = '',
  [string]$DestinationPath = ''
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $SourcePath) { $SourcePath = Join-Path $root 'logo\fluffy-grok-white-left-source.png' }
if (-not $DestinationPath) { $DestinationPath = Join-Path $root 'logo\fluffy-grok-master.png' }
if (-not (Test-Path -LiteralPath $SourcePath)) { throw "Missing white-left Fluffy source: $SourcePath" }

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
try {
  $source = New-Object System.Drawing.Bitmap $sourceImage.Width, $sourceImage.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($source)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImageUnscaled($sourceImage, 0, 0)
  } finally {
    $graphics.Dispose()
  }
} finally {
  $sourceImage.Dispose()
}

$output = New-Object System.Drawing.Bitmap $source.Width, $source.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$rect = New-Object System.Drawing.Rectangle 0, 0, $source.Width, $source.Height
$sourceData = $source.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outputData = $output.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
  $byteCount = [Math]::Abs($sourceData.Stride) * $source.Height
  $sourceBytes = New-Object byte[] $byteCount
  $outputBytes = New-Object byte[] $byteCount
  [System.Runtime.InteropServices.Marshal]::Copy($sourceData.Scan0, $sourceBytes, 0, $byteCount)

  for ($y = 0; $y -lt $source.Height; $y++) {
    $row = $y * $sourceData.Stride
    for ($x = 0; $x -lt $source.Width; $x++) {
      $index = $row + ($x * 4)
      $blue = $sourceBytes[$index]
      $green = $sourceBytes[$index + 1]
      $red = $sourceBytes[$index + 2]
      $alpha = $sourceBytes[$index + 3]
      $outputBytes[$index + 3] = $alpha
      if ($alpha -eq 0) { continue }

      # Convert to neutral grayscale before inversion so chroma-key residue cannot
      # become colored edge noise. Inversion keeps the word readable (not mirrored).
      $luminance = [int](($red * 77 + $green * 150 + $blue * 29 + 128) -shr 8)
      $inverse = [byte](255 - $luminance)
      $outputBytes[$index] = $inverse
      $outputBytes[$index + 1] = $inverse
      $outputBytes[$index + 2] = $inverse
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($outputBytes, 0, $outputData.Scan0, $byteCount)
} finally {
  $source.UnlockBits($sourceData)
  $output.UnlockBits($outputData)
  $source.Dispose()
}

$destinationDirectory = Split-Path $DestinationPath -Parent
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
$temporaryPath = Join-Path $destinationDirectory ('.fluffy-grok-master.' + [guid]::NewGuid().ToString('N') + '.png')
try {
  $output.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Move-Item -Force -LiteralPath $temporaryPath -Destination $DestinationPath
} finally {
  $output.Dispose()
  if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -Force -LiteralPath $temporaryPath }
}

Write-Host "Desktop brand master generated: black-left / white-right -> $DestinationPath"
