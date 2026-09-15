param(
  [string]$OutputDirectory = "release"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot $OutputDirectory
$stagingName = "it-support-portal-source"
$stagingRoot = Join-Path $releaseRoot $stagingName
$zipPath = Join-Path $releaseRoot "$stagingName.zip"

if (Test-Path $stagingRoot) {
  Remove-Item $stagingRoot -Recurse -Force
}
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

$items = @(
  ".env.example",
  ".gitignore",
  "README.md",
  "package.json",
  "package-lock.json",
  "index.html",
  ".github",
  "css",
  "data",
  "docs",
  "js",
  "pages",
  "server",
  "tests"
)

foreach ($item in $items) {
  $source = Join-Path $projectRoot $item
  if (-not (Test-Path $source)) {
    continue
  }

  $destination = Join-Path $stagingRoot $item
  if ((Get-Item $source).PSIsContainer) {
    Copy-Item $source $destination -Recurse -Force
  } else {
    $destinationParent = Split-Path -Parent $destination
    if ($destinationParent -and -not (Test-Path $destinationParent)) {
      New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
    }
    Copy-Item $source $destination -Force
  }
}

$privatePatterns = @(
  ".env",
  ".env.local",
  ".env.development",
  ".env.production"
)

foreach ($privateFile in $privatePatterns) {
  $target = Join-Path $stagingRoot $privateFile
  if (Test-Path $target) {
    Remove-Item $target -Force
  }
}

$certDirectory = Join-Path $stagingRoot "server/certs"
if (Test-Path $certDirectory) {
  Get-ChildItem $certDirectory -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -in @(".pem", ".crt", ".key") } |
    Remove-Item -Force
}

$forbiddenNames = @("node_modules", ".git", ".vercel")
foreach ($name in $forbiddenNames) {
  Get-ChildItem $stagingRoot -Directory -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq $name } |
    Remove-Item -Recurse -Force
}

$forbiddenFiles = Get-ChildItem $stagingRoot -File -Recurse -Force |
  Where-Object {
    $_.Name -match '^\.env($|\.)' -and $_.Name -ne '.env.example'
  }

if ($forbiddenFiles) {
  $names = ($forbiddenFiles | ForEach-Object { $_.FullName }) -join "`n"
  throw "Private environment files remain in staging:`n$names"
}

Compress-Archive -Path $stagingRoot -DestinationPath $zipPath -CompressionLevel Optimal -Force

Write-Host "Release package created:"
Write-Host $zipPath
