# PowerShell script to check if the FastAPI backend is running
Write-Host "Checking AI Readiness Assessment Backend API status..." -ForegroundColor Cyan

# Define the API endpoint to check
$apiEndpoint = "http://127.0.0.1:8000"

# Check for Python processes
function Check-BackendProcess {
    $pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue | 
                      Where-Object {$_.CommandLine -like "*uvicorn*" -or $_.CommandLine -like "*fastapi*"}
    
    if ($pythonProcesses) {
        Write-Host "✅ Backend process is running:" -ForegroundColor Green
        foreach ($process in $pythonProcesses) {
            Write-Host "   - PID: $($process.Id), Started: $((Get-Process -Id $process.Id).StartTime)" -ForegroundColor Green
        }
        return $true
    } else {
        Write-Host "❌ No FastAPI backend process found running" -ForegroundColor Red
        return $false
    }
}

# Test HTTP connection to the backend
function Test-BackendConnection {
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $apiEndpoint -Method GET -TimeoutSec 5 -ErrorAction Stop
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "✅ Backend API is responding:" -ForegroundColor Green
        Write-Host "   - Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        Write-Host "   - Response time: $([math]::Round($responseTime, 2)) ms" -ForegroundColor Green
        Write-Host "   - Content type: $($response.Headers['Content-Type'])" -ForegroundColor Green
        return $true
    } catch [System.Net.WebException] {
        Write-Host "❌ Failed to connect to backend API: $($_.Exception.Message)" -ForegroundColor Red
        
        # More detailed error analysis
        if ($_.Exception.Status -eq 'Timeout') {
            Write-Host "   - Request timed out. The server might be overloaded or not responding properly." -ForegroundColor Red
        } elseif ($_.Exception.Response) {
            Write-Host "   - Server returned: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        } else {
            Write-Host "   - The server might not be running or is not accessible." -ForegroundColor Red
        }
        return $false
    } catch {
        Write-Host "❌ Unexpected error checking backend: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test CORS configuration 
function Test-CorsConfiguration {
    try {
        # Simulate a CORS preflight request
        $headers = @{
            'Origin' = 'http://localhost:3000'
            'Access-Control-Request-Method' = 'GET'
            'Access-Control-Request-Headers' = 'Content-Type'
        }
        
        $response = Invoke-WebRequest -Uri $apiEndpoint -Method OPTIONS -Headers $headers -TimeoutSec 5 -ErrorAction Stop
        
        # Check CORS headers
        if ($response.Headers['Access-Control-Allow-Origin']) {
            Write-Host "✅ CORS is properly configured:" -ForegroundColor Green
            Write-Host "   - Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
            Write-Host "   - Allow-Methods: $($response.Headers['Access-Control-Allow-Methods'])" -ForegroundColor Green
            Write-Host "   - Allow-Headers: $($response.Headers['Access-Control-Allow-Headers'])" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ CORS headers not found in OPTIONS response. CORS might not be configured properly." -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "⚠️ Failed to test CORS configuration: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Check the API health
function Test-ApiHealth {
    try {
        $response = Invoke-RestMethod -Uri "$apiEndpoint/" -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.message) {
            Write-Host "✅ API Health: $($response.message)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ API responded but health check message not found" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check API documentation
function Test-ApiDocs {
    try {
        $response = Invoke-WebRequest -Uri "$apiEndpoint/docs" -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API documentation (Swagger UI) is available at $apiEndpoint/docs" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "⚠️ API documentation is not accessible" -ForegroundColor Yellow
        return $false
    }
}

# Check if questionnaires endpoint is working
function Test-QuestionnairesEndpoint {
    try {
        $response = Invoke-RestMethod -Uri "$apiEndpoint/questionnaires" -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        if ($response -and $response.GetType().Name -eq "PSCustomObject") {
            $questionnaireCount = 0
            foreach ($prop in $response.PSObject.Properties) {
                $questionnaireCount++
            }
            
            Write-Host "✅ Questionnaires endpoint is working - found $questionnaireCount assessment type(s)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ Questionnaires endpoint returned an unexpected response format" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Questionnaires endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Run all checks
$processRunning = Check-BackendProcess
Write-Host ""

if ($processRunning) {
    $apiResponding = Test-BackendConnection
    Write-Host ""
    
    if ($apiResponding) {
        Test-CorsConfiguration
        Write-Host ""
        
        Test-ApiHealth
        Write-Host ""
        
        Test-ApiDocs
        Write-Host ""
        
        Test-QuestionnairesEndpoint
        Write-Host ""
    }
} else {
    Write-Host "Would you like to start the backend server now? (Y/n)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -ne "n" -and $response -ne "N") {
        Write-Host "Starting the backend server..." -ForegroundColor Green
        $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        $startBackendPath = Join-Path $scriptPath "start-backend.ps1"
        
        if (Test-Path $startBackendPath) {
            Start-Process powershell -ArgumentList "-NoExit", "-File", "$startBackendPath"
            Write-Host "Backend server starting. Please wait for it to initialize..." -ForegroundColor Green
        } else {
            Write-Host "Could not find start-backend.ps1 script. Please start the backend manually." -ForegroundColor Red
        }
    }
}

Write-Host "Check completed. If any issues were found, please fix them or contact support." -ForegroundColor Cyan 