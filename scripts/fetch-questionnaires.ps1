# PowerShell script to fetch questionnaires directly from local endpoint
Write-Host "Fetching questionnaires from http://103.18.20.205:8090/questionnaires..."

try {
    $response = Invoke-RestMethod -Uri "http://103.18.20.205:8090/questionnaires" -Method Get -Headers @{
        "Accept" = "application/json"
        "Content-Type" = "application/json"
        "Cache-Control" = "no-cache"
    } -TimeoutSec 30

    Write-Host "Successfully fetched questionnaires"
    
    # Output the data in a readable format
    $jsonResponse = $response | ConvertTo-Json -Depth 10
    Write-Host $jsonResponse
}
catch {
    Write-Host "Error fetching questionnaires: $_" -ForegroundColor Red
} 