Write-Host "Setting up environment variables..." -ForegroundColor Yellow

# Create or update .env.local file
$envContent = @"
NEXT_PUBLIC_API_URL=http://103.18.20.205:8090
"@

# Get the root directory of the project
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envPath = Join-Path $projectRoot ".env.local"

# Write the content to .env.local
Set-Content -Path $envPath -Value $envContent -Force

Write-Host "Environment variables set up successfully!" -ForegroundColor Green
Write-Host "Created .env.local file with NEXT_PUBLIC_API_URL set to http://103.18.20.205:8090" -ForegroundColor Cyan 