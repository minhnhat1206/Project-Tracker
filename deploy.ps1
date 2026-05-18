# deploy.ps1 — Build React app and push to Google Apps Script

param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

Write-Host "=== Project Tracker Deploy ===" -ForegroundColor Cyan

# Step 1: Build React app
if (-not $NoBuild) {
    Write-Host "`n[1/3] Building React app..." -ForegroundColor Yellow
    npm run build
    if (-not $?) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }
    Write-Host "Build OK" -ForegroundColor Green
} else {
    Write-Host "`n[1/3] Skipping build (--NoBuild)" -ForegroundColor Gray
}

# Step 2: Prepare deploy folder
Write-Host "`n[2/3] Preparing deploy folder..." -ForegroundColor Yellow

$deployDir = ".\deploy"
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy GAS files
Copy-Item ".\gas\*.gs" $deployDir
Copy-Item ".\appsscript.json" $deployDir

# Copy built HTML as index.html
$builtHtml = ".\dist\index.html"
if (-not (Test-Path $builtHtml)) {
    Write-Host "ERROR: dist/index.html not found. Run without -NoBuild." -ForegroundColor Red
    exit 1
}
Copy-Item $builtHtml "$deployDir\index.html"

Write-Host "Files in deploy folder:" -ForegroundColor Gray
Get-ChildItem $deployDir | ForEach-Object { Write-Host "  - $($_.Name)" }

# Step 3: Push with clasp
Write-Host "`n[3/3] Pushing to Google Apps Script..." -ForegroundColor Yellow

$claspJson = ".\deploy\.clasp.json"
if (-not (Test-Path $claspJson)) {
    # Copy .clasp.json if it exists at root
    if (Test-Path ".\.clasp.json") {
        Copy-Item ".\.clasp.json" $deployDir
    } else {
        Write-Host "ERROR: .clasp.json not found!" -ForegroundColor Red
        Write-Host "Run: clasp create --type webapp --title 'Project Tracker'" -ForegroundColor Yellow
        Write-Host "Then copy the generated .clasp.json to this folder." -ForegroundColor Yellow
        exit 1
    }
}

Push-Location $deployDir
clasp push
if ($?) {
    Write-Host "`nDeploy complete!" -ForegroundColor Green
    Write-Host "To create a new deployment: clasp deploy --description 'v1.0'" -ForegroundColor Cyan
    Write-Host "To open in browser: clasp open --webapp" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
}
Pop-Location
