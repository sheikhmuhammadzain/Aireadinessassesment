# PowerShell script to start the FastAPI backend server
Write-Host "Starting AI Readiness Assessment Backend API..." -ForegroundColor Cyan

# Change to the backend directory
Set-Location -Path "$PSScriptRoot\..\backend"

# Check if Python exists and is callable
try {
    $pythonVersion = python --version
    Write-Host "Using $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please ensure Python is installed and in your PATH." -ForegroundColor Red
    exit 1
}

# Check if FastAPI is installed
try {
    $fastApiVersion = python -c "import fastapi; print(f'FastAPI version {fastapi.__version__}')"
    Write-Host "$fastApiVersion detected" -ForegroundColor Green
} catch {
    Write-Host "FastAPI not installed. Installing requirements..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install requirements. Please check requirements.txt and your Python installation." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Requirements installed successfully" -ForegroundColor Green
}

# Start the backend server
Write-Host "Starting FastAPI server at http://127.0.0.1:8000..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Run the FastAPI server with uvicorn
# --reload: Reload server on code changes
# --host 0.0.0.0: Listen on all network interfaces (allows access from other devices)
# --port 8000: Run on port 8000
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 