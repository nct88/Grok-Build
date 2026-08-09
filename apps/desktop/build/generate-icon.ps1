#Requires -Version 5.1
<#
.SYNOPSIS
  Build Windows-standard app icons from the Grok Build black-left/white-right master.

  - Flood-fill outer near-white canvas only (preserve mark inside tile)
  - Crop TIGHT to opaque bounds (minimal padding — fills taskbar/desktop like native apps)
  - Multi-size classic 32bpp BMP-in-ICO (16…256 + 20/40 for Win DPI)
  - icon.png 256 + renderer logo
#>
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$root = (Resolve-Path (Join-Path $here "..\..\..")).Path
# Prefer the Grok Build-specific split Fluffy master; retain older artwork as fallbacks.
$srcFluffy = Join-Path $root "logo\fluffy-grok-master.png"
$srcMain = Join-Path $root "logo\grok-main-logo.png"
$srcLegacy = Join-Path $root "logo\grok-app.png"
$srcPath = if (Test-Path -LiteralPath $srcFluffy) { $srcFluffy } elseif (Test-Path -LiteralPath $srcMain) { $srcMain } else { $srcLegacy }
$outIco = Join-Path $here "icon.ico"
$outPng = Join-Path $here "icon.png"
$processedDir = Join-Path $root "logo\processed"
New-Item -ItemType Directory -Force -Path $processedDir | Out-Null

if (-not (Test-Path -LiteralPath $srcPath)) { throw "Missing logo source (fluffy-grok-master.png, grok-main-logo.png, or grok-app.png)" }
Write-Host "Icon source: $srcPath"

Add-Type -AssemblyName System.Drawing

function Get-PixelBuffer([System.Drawing.Bitmap]$bmp) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [Math]::Abs($data.Stride) * $bmp.Height
  $buf = New-Object byte[] $bytes
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $bytes)
  return @{ Data = $data; Buf = $buf; Stride = $data.Stride; W = $bmp.Width; H = $bmp.Height }
}

function Set-PixelBuffer([System.Drawing.Bitmap]$bmp, $state) {
  [System.Runtime.InteropServices.Marshal]::Copy($state.Buf, 0, $state.Data.Scan0, $state.Buf.Length)
  $bmp.UnlockBits($state.Data)
}

function Test-CanvasColor([byte]$b, [byte]$g, [byte]$r, [byte]$a) {
  if ($a -lt 8) { return $true }
  return ($r -ge 248 -and $g -ge 248 -and $b -ge 248)
}

function Clear-OuterCanvas([System.Drawing.Bitmap]$bmp) {
  $st = Get-PixelBuffer $bmp
  $buf = $st.Buf; $stride = $st.Stride; $w = $st.W; $h = $st.H
  $visited = New-Object bool[] ($w * $h)
  $qx = New-Object System.Collections.Generic.Queue[int]
  $qy = New-Object System.Collections.Generic.Queue[int]

  function Enq([int]$x, [int]$y) {
    if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { return }
    $idx = $y * $w + $x
    if ($visited[$idx]) { return }
    $i = $y * $stride + $x * 4
    if (-not (Test-CanvasColor $buf[$i] $buf[$i+1] $buf[$i+2] $buf[$i+3])) { return }
    $visited[$idx] = $true
    $qx.Enqueue($x); $qy.Enqueue($y)
  }

  for ($x = 0; $x -lt $w; $x++) { Enq $x 0; Enq $x ($h - 1) }
  for ($y = 0; $y -lt $h; $y++) { Enq 0 $y; Enq ($w - 1) $y }

  while ($qx.Count -gt 0) {
    $x = $qx.Dequeue(); $y = $qy.Dequeue()
    $i = $y * $stride + $x * 4
    $buf[$i] = 0; $buf[$i+1] = 0; $buf[$i+2] = 0; $buf[$i+3] = 0
    Enq ($x + 1) $y; Enq ($x - 1) $y; Enq $x ($y + 1); Enq $x ($y - 1)
  }
  Set-PixelBuffer $bmp $st
}

function Get-OpaqueBounds([System.Drawing.Bitmap]$bmp) {
  $st = Get-PixelBuffer $bmp
  $buf = $st.Buf; $stride = $st.Stride; $w = $st.W; $h = $st.H
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($buf[$row + $x * 4 + 3] -gt 12) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $bmp.UnlockBits($st.Data)
  if ($maxX -lt 0) { throw "No content after canvas clear" }
  return @{ X = $minX; Y = $minY; W = ($maxX - $minX + 1); H = ($maxY - $minY + 1) }
}

function Get-BmpIconImage([System.Drawing.Bitmap]$src) {
  $w = $src.Width; $h = $src.Height
  $st = Get-PixelBuffer $src
  $buf = $st.Buf; $stride = $st.Stride
  $xor = New-Object byte[] ($w * $h * 4)
  $p = 0
  for ($y = $h - 1; $y -ge 0; $y--) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      $i = $row + $x * 4
      $xor[$p++] = $buf[$i]
      $xor[$p++] = $buf[$i + 1]
      $xor[$p++] = $buf[$i + 2]
      $xor[$p++] = $buf[$i + 3]
    }
  }
  $src.UnlockBits($st.Data)
  $rowBytes = [int][Math]::Ceiling($w / 32.0) * 4
  $and = New-Object byte[] ($rowBytes * $h)

  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter $ms
  $bw.Write([int]40)
  $bw.Write([int]$w)
  $bw.Write([int]($h * 2))
  $bw.Write([int16]1)
  $bw.Write([int16]32)
  $bw.Write([int]0)
  $bw.Write([int]$xor.Length)
  $bw.Write([int]0); $bw.Write([int]0); $bw.Write([int]0); $bw.Write([int]0)
  $bw.Write($xor)
  $bw.Write($and)
  $bw.Flush()
  $bytes = $ms.ToArray()
  $bw.Dispose(); $ms.Dispose()
  return , $bytes
}

function Write-ClassicIco([string]$path, [System.Drawing.Bitmap[]]$bmps) {
  $images = New-Object System.Collections.Generic.List[byte[]]
  foreach ($b in $bmps) {
    $blob = Get-BmpIconImage $b
    if ($blob -is [byte[]]) { [void]$images.Add($blob) }
    else { [void]$images.Add([byte[]]@($blob)) }
  }
  $count = $images.Count
  if ($count -lt 1) { throw "No icon frames" }
  $offset = 6 + 16 * $count
  $fs = [System.IO.File]::Create($path)
  $bw = New-Object System.IO.BinaryWriter $fs
  $bw.Write([uint16]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]$count)
  $off = $offset
  $entries = New-Object System.Collections.Generic.List[object]
  for ($i = 0; $i -lt $count; $i++) {
    $s = $bmps[$i].Width
    $dim = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $len = $images[$i].Length
    if ($len -lt 40) { throw "Icon frame $i too small ($len)" }
    [void]$entries.Add([pscustomobject]@{ w = $dim; h = $dim; len = $len; off = $off })
    $off += $len
  }
  foreach ($e in $entries) {
    $bw.Write([byte]$e.w)
    $bw.Write([byte]$e.h)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$e.len)
    $bw.Write([uint32]$e.off)
  }
  foreach ($img in $images) { $bw.Write($img) }
  $bw.Flush(); $fs.Close()
  $size = (Get-Item $path).Length
  if ($size -lt 1000) { throw "icon.ico too small ($size)" }
}

function New-SizedIcon([System.Drawing.Bitmap]$master, [int]$s) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gg = [System.Drawing.Graphics]::FromImage($bmp)
  # Full-bleed into icon canvas (standard Windows app icons fill the cell)
  $gg.Clear([System.Drawing.Color]::Transparent)
  $gg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gg.DrawImage($master, 0, 0, $s, $s)
  $gg.Dispose()
  return $bmp
}

# --- load at high res ---
$raw = [System.Drawing.Image]::FromFile($srcPath)
$workN = 1024
$work = New-Object System.Drawing.Bitmap $workN, $workN, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($work)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($raw, 0, 0, $workN, $workN)
$g.Dispose(); $raw.Dispose()
Write-Host "Loaded work ${workN}x${workN}"

$opaqueCorners = @(
  $work.GetPixel(0, 0).A,
  $work.GetPixel($work.Width - 1, 0).A,
  $work.GetPixel(0, $work.Height - 1).A,
  $work.GetPixel($work.Width - 1, $work.Height - 1).A
) | Where-Object { $_ -ge 8 }
if ($opaqueCorners.Count -eq 0) {
  Write-Host "Transparent outer canvas detected; preserving connected white fur."
} else {
  Clear-OuterCanvas $work
  Write-Host "Opaque outer canvas cleared."
}

$b = Get-OpaqueBounds $work
Write-Host ("Tight bounds x={0} y={1} w={2} h={3}" -f $b.X, $b.Y, $b.W, $b.H)
$cropped = $work.Clone((New-Object System.Drawing.Rectangle $b.X, $b.Y, $b.W, $b.H), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$work.Dispose()

# Square, crop SAT (0 margin) — Windows taskbar/desktop expect content to fill the glyph
$side = [Math]::Max($cropped.Width, $cropped.Height)
$master = New-Object System.Drawing.Bitmap $side, $side, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gm = [System.Drawing.Graphics]::FromImage($master)
$gm.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gm.Clear([System.Drawing.Color]::Transparent)
$gm.DrawImage($cropped, [int](($side - $cropped.Width) / 2), [int](($side - $cropped.Height) / 2), $cropped.Width, $cropped.Height)
$gm.Dispose(); $cropped.Dispose()
$master.Save((Join-Path $processedDir "app-icon-master.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Master $($master.Width)x$($master.Height) margin=0 (edge-tight)"

$hasWhite = $false
for ($y = 0; $y -lt $master.Height; $y += 4) {
  for ($x = 0; $x -lt $master.Width; $x += 4) {
    $p = $master.GetPixel($x, $y)
    if ($p.A -gt 200 -and $p.R -gt 230 -and $p.G -gt 230 -and $p.B -gt 230) { $hasWhite = $true; break }
  }
  if ($hasWhite) { break }
}
# White "grok" / mark should remain; allow dark-only marks as soft warn
if (-not $hasWhite) {
  Write-Host "WARN: no bright mark detected (ok if logo is monochrome dark)"
} else {
  Write-Host "Bright mark OK"
}

# Full Windows size set (incl. shell DPI 20/40)
$sizes = @(16, 20, 24, 32, 40, 48, 64, 128, 256)
$bitmaps = New-Object System.Collections.Generic.List[System.Drawing.Bitmap]
foreach ($s in $sizes) {
  $bmp = New-SizedIcon $master $s
  $bitmaps.Add($bmp) | Out-Null
  $bmp.Save((Join-Path $processedDir "icon-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "  frame ${s}x${s}"
}

# icon.png = 256
$bitmaps[$bitmaps.Count - 1].Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
Write-ClassicIco $outIco $bitmaps.ToArray()

$b512 = New-SizedIcon $master 512
$b512.Save((Join-Path $processedDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$b512.Dispose()

$rendererLogo = Join-Path $root "apps\desktop\renderer\assets\logo.png"
New-Item -ItemType Directory -Force -Path (Split-Path $rendererLogo) | Out-Null
Copy-Item -Force $outPng $rendererLogo

# Fill ratio check on 256
$probe = [System.Drawing.Bitmap]::FromFile($outPng)
$minX = $probe.Width; $minY = $probe.Height; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $probe.Height; $y += 2) {
  for ($x = 0; $x -lt $probe.Width; $x += 2) {
    if ($probe.GetPixel($x, $y).A -gt 12) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$fill = [Math]::Round(100.0 * ($maxX - $minX + 1) / $probe.Width, 1)
$probe.Dispose()
Write-Host "256 fill ratio: ${fill}% (target >= 96%)"

foreach ($bm in $bitmaps) { $bm.Dispose() }
$master.Dispose()

Write-Host "Wrote $outIco ($((Get-Item $outIco).Length) bytes) TIGHT BMP-ICO"
Write-Host "Wrote $outPng ($((Get-Item $outPng).Length) bytes)"
