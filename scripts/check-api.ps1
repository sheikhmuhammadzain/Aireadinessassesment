# PowerShell script to check if the backend API is running and accessible
Write-Host "Checking connection to backend API at http://103.18.20.205:8090..." -ForegroundColor Yellow

# Test network connectivity to the port
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 8000 -InformationLevel Quiet
    
    if ($testConnection) {
        Write-Host "✓ TCP connection to port 8000 is OPEN" -ForegroundColor Green
    } else {
        Write-Host "✗ TCP connection to port 8000 is CLOSED" -ForegroundColor Red
        Write-Host "The backend server does not appear to be running. Please start the FastAPI server." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error testing connection: $_" -ForegroundColor Red
    exit 1
}

# Now try to fetch the questionnaires endpoint
Write-Host "Testing API endpoint: http://103.18.20.205:8090/questionnaires" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://103.18.20.205:8090/questionnaires" -UseBasicParsing -TimeoutSec 5 -Method Get
    
    Write-Host "✓ API returned status code: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    
    # Check if the response is valid JSON containing questionnaire data
    $content = $response.Content
    if ($content -match "AI Culture|AI Governance|AI Strategy") {
        Write-Host "✓ API response contains questionnaire data" -ForegroundColor Green
        
        # Show a small preview of the data
        Write-Host "Data preview (first few categories):" -ForegroundColor Cyan
        Write-Host ($content.Substring(0, [Math]::Min(500, $content.Length)) + "...") -ForegroundColor Gray
    } else {
        Write-Host "✗ API response does not contain expected questionnaire data" -ForegroundColor Red
        Write-Host "Response preview:" -ForegroundColor Cyan
        Write-Host ($content.Substring(0, [Math]::Min(300, $content.Length)) + "...") -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error accessing API: $_" -ForegroundColor Red
    
    if ($_.Exception.Message -match "timed out") {
        Write-Host "The request timed out. The server might be running but is not responding." -ForegroundColor Red
    } elseif ($_.Exception.Message -match "Unable to connect") {
        Write-Host "Unable to connect to the server. The FastAPI backend does not appear to be running." -ForegroundColor Red
    } else {
        Write-Host "The backend server returned an error. Check the FastAPI logs for details." -ForegroundColor Red
    }
    
    exit 1
}

Write-Host "`nAPI Connection Check Complete" -ForegroundColor Green
Write-Host "If your application is still having trouble connecting, please check:"
Write-Host "1. The server is running on the correct port (8000)"
Write-Host "2. There are no firewall or antivirus blocking the connection"
Write-Host "3. The API_URL in .env.local is set to http://103.18.20.205:8090" 