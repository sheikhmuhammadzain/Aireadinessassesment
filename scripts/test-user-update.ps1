Write-Host "Testing User API Update Functionality" -ForegroundColor Cyan

$API_URL = "http://103.18.20.205:8090"
$TOKEN = ""

# Step 1: Login as admin to get token
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
$loginData = @{
    username = "admin@cybergen.com"
    password = "adminpassword"  # Update with the actual admin password
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/token" -Method Post -Body $loginData -ContentType "application/x-www-form-urlencoded"
    $TOKEN = $loginResponse.access_token
    Write-Host "  - Login successful! Token received." -ForegroundColor Green
} catch {
    Write-Host "  - Login failed: $_" -ForegroundColor Red
    exit
}

# Add Authorization header for subsequent requests
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Create a new test user
Write-Host "2. Creating a test user..." -ForegroundColor Yellow
$newUser = @{
    email = "testuser_$(Get-Random)@example.com"
    name = "Test User"
    role = "ai_culture"
    password = "password123"
} | ConvertTo-Json

try {
    $createdUser = Invoke-RestMethod -Uri "$API_URL/users" -Method Post -Headers $headers -Body $newUser
    Write-Host "  - User created successfully!" -ForegroundColor Green
    Write-Host "    * $($createdUser.name) - $($createdUser.email) - ID: $($createdUser.id)" -ForegroundColor White
    $testUserId = $createdUser.id
} catch {
    Write-Host "  - Failed to create user: $_" -ForegroundColor Red
    exit
}

# Step 3: Update the user WITHOUT changing the password
Write-Host "3. Updating user name and role (keeping same password)..." -ForegroundColor Yellow
$updatedUserNoPw = @{
    email = $createdUser.email
    name = "Updated Test User - No PW Change"
    role = "ai_infrastructure"
} | ConvertTo-Json

try {
    $updatedUserResponse = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Put -Headers $headers -Body $updatedUserNoPw
    Write-Host "  - User updated successfully without password change!" -ForegroundColor Green
    Write-Host "    * $($updatedUserResponse.name) - $($updatedUserResponse.email) - Role: $($updatedUserResponse.role)" -ForegroundColor White
} catch {
    Write-Host "  - Failed to update user without password: $_" -ForegroundColor Red
}

# Step 4: Update the user WITH password change
Write-Host "4. Updating user with password change..." -ForegroundColor Yellow
$updatedUserWithPw = @{
    email = $createdUser.email
    name = "Updated Test User - With PW Change"
    role = "ai_strategy"
    password = "newpassword123"
} | ConvertTo-Json

try {
    $updatedUserWithPwResponse = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Put -Headers $headers -Body $updatedUserWithPw
    Write-Host "  - User updated successfully with password change!" -ForegroundColor Green
    Write-Host "    * $($updatedUserWithPwResponse.name) - $($updatedUserWithPwResponse.email) - Role: $($updatedUserWithPwResponse.role)" -ForegroundColor White
} catch {
    Write-Host "  - Failed to update user with password: $_" -ForegroundColor Red
}

# Step 5: Verify user login with new password
Write-Host "5. Verifying user login with new password..." -ForegroundColor Yellow
$loginTestData = @{
    username = $createdUser.email
    password = "newpassword123"
}

try {
    $testLoginResponse = Invoke-RestMethod -Uri "$API_URL/token" -Method Post -Body $loginTestData -ContentType "application/x-www-form-urlencoded"
    Write-Host "  - Login successful with new password!" -ForegroundColor Green
    Write-Host "    * User: $($testLoginResponse.user.name)" -ForegroundColor White
} catch {
    Write-Host "  - Login failed with new password: $_" -ForegroundColor Red
}

# Step 6: Delete the test user (cleanup)
Write-Host "6. Cleaning up - deleting test user..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Delete -Headers $headers
    Write-Host "  - User deleted successfully!" -ForegroundColor Green
} catch {
    Write-Host "  - Failed to delete user: $_" -ForegroundColor Red
}

Write-Host "`nTest script completed!" -ForegroundColor Cyan 