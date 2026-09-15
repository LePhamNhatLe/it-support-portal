param(
  [string]$OutputDirectory = "release"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot $OutputDirectory
$stagingName = "it-support-portal-source"
$stagingRoot = Join-Path $releaseRoot $stagingName
$zipPath = Join-Path $releaseRoot "$stagingName.zip"
$packageLockPath = Join-Path $projectRoot "package-lock.json"

if (-not (Test-Path $packageLockPath)) {
  Write-Host "package-lock.json not found. Generating it before packaging..."
  Push-Location $projectRoot
  try {
    & npm install --package-lock-only --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to generate package-lock.json. Make sure Node.js/npm and internet access are available."
    }
  } finally {
    Pop-Location
  }
}

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
  "scripts",
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

$apiClientPath = Join-Path $stagingRoot "js/api-client.js"
if (Test-Path $apiClientPath) {
  $apiClientContent = Get-Content $apiClientPath -Raw
  $hostedApiLine = 'const DEFAULT_BASE_URL = "https://it-support-portal-api.onrender.com/api/v1";'
  $localApiLine = 'const DEFAULT_BASE_URL = "http://localhost:3000/api/v1";'

  if ($apiClientContent.Contains($hostedApiLine)) {
    $apiClientContent = $apiClientContent.Replace($hostedApiLine, $localApiLine)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($apiClientPath, $apiClientContent, $utf8NoBom)
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

$requiredReleaseItems = @(
  "README.md",
  ".env.example",
  "package.json",
  "package-lock.json",
  "index.html",
  "pages",
  "css",
  "js",
  "server",
  "tests",
  "docs",
  "scripts"
)

$missingRequiredItems = @()
foreach ($requiredItem in $requiredReleaseItems) {
  if (-not (Test-Path (Join-Path $stagingRoot $requiredItem))) {
    $missingRequiredItems += $requiredItem
  }
}

if ($missingRequiredItems.Count -gt 0) {
  throw "Release package is missing required items: $($missingRequiredItems -join ', ')"
}

Compress-Archive -Path $stagingRoot -DestinationPath $zipPath -CompressionLevel Optimal -Force

Write-Host "Release package created:"
Write-Host $zipPath
Write-Host "Buyer package default API: http://localhost:3000/api/v1"
