# PowerShell script to start both the Next.js frontend and FastAPI backend
Write-Host "Starting AI Readiness Assessment Application..." -ForegroundColor Cyan
Write-Host "This script will start both the frontend and backend servers" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $result = $null
    try {
        $result = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
    } catch {}
    
    return $result
}

# Check if the backend port is already in use
$backendPort = 8000
if (Test-PortInUse -Port $backendPort) {
    Write-Host "Port $backendPort is already in use!" -ForegroundColor Yellow
    Write-Host "The backend server might already be running." -ForegroundColor Yellow
    
    $response = Read-Host "Do you want to continue starting the frontend only? (Y/n)"
    if ($response -eq "n" -or $response -eq "N") {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
    
    # Skip starting the backend
    $skipBackend = $true
} else {
    $skipBackend = $false
}

# Check if the frontend port is already in use
$frontendPort = 3000
if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Port $frontendPort is already in use!" -ForegroundColor Yellow
    Write-Host "The frontend server might already be running." -ForegroundColor Yellow
    
    if ($skipBackend) {
        Write-Host "Both ports are in use. Exiting..." -ForegroundColor Red
        exit 1
    }
    
    $response = Read-Host "Do you want to continue starting the backend only? (Y/n)"
    if ($response -eq "n" -or $response -eq "N") {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
    
    # Skip starting the frontend
    $skipFrontend = $true
} else {
    $skipFrontend = $false
}

# Get current directory and project root
$scriptPath = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptPath

# 1. Start Backend in a new window
if (-not $skipBackend) {
    Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-backend.ps1"
    
    # Wait for backend to start
    Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
    $maxRetries = 10
    $retry = 0
    $backendReady = $false
    
    while (-not $backendReady -and $retry -lt $maxRetries) {
        Start-Sleep -Seconds 2
        $retry++
        
        try {
            $response = Invoke-WebRequest -Uri "http://103.18.20.205:8090" -Method GET -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Host "Backend is ready!" -ForegroundColor Green
            }
        } catch {
            Write-Host "Backend not ready yet, retrying... ($retry/$maxRetries)" -ForegroundColor Yellow
        }
    }
    
    if (-not $backendReady) {
        Write-Host "Backend did not start properly. Please check the backend window for errors." -ForegroundColor Red
        if ($skipFrontend) {
            exit 1
        }
    }
}

# 2. Start Frontend in a new window
if (-not $skipFrontend) {
    Write-Host "Starting Next.js frontend server..." -ForegroundColor Green
    
    # Change to project root
    Set-Location -Path $projectRoot
    
    # Start Next.js in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    # Wait for frontend to start
    Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Open browser to frontend
    Write-Host "Opening frontend in browser..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
}

# Print information
Write-Host "Applications started successfully!" -ForegroundColor Green
Write-Host "Backend API: http://103.18.20.205:8090" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Documentation: http://103.18.20.205:8090/docs" -ForegroundColor Cyan
Write-Host "To stop the servers, close the terminal windows or press Ctrl+C in each window" -ForegroundColor Yellow 