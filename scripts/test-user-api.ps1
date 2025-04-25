Write-Host "Testing User API Endpoints" -ForegroundColor Cyan

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

# Step 2: List all users
Write-Host "2. Fetching all users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$API_URL/users" -Method Get -Headers $headers
    Write-Host "  - Found $($users.Count) users:" -ForegroundColor Green
    foreach ($user in $users) {
        Write-Host "    * $($user.name) - $($user.email) - Role: $($user.role) - ID: $($user.id)" -ForegroundColor White
    }
} catch {
    Write-Host "  - Failed to fetch users: $_" -ForegroundColor Red
}

# Step 3: Create a new test user
Write-Host "3. Creating a test user..." -ForegroundColor Yellow
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

# Step 4: Update the user
Write-Host "4. Updating the test user..." -ForegroundColor Yellow
$updatedUser = @{
    email = $createdUser.email
    name = "Updated Test User"
    role = "ai_infrastructure"
    password = "newpassword123"
} | ConvertTo-Json

try {
    $updatedUserResponse = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Put -Headers $headers -Body $updatedUser
    Write-Host "  - User updated successfully!" -ForegroundColor Green
    Write-Host "    * $($updatedUserResponse.name) - $($updatedUserResponse.email) - Role: $($updatedUserResponse.role)" -ForegroundColor White
} catch {
    Write-Host "  - Failed to update user: $_" -ForegroundColor Red
}

# Step 5: Fetch the updated user
Write-Host "5. Fetching the updated user..." -ForegroundColor Yellow
try {
    $fetchedUser = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Get -Headers $headers
    Write-Host "  - User fetched successfully!" -ForegroundColor Green
    Write-Host "    * $($fetchedUser.name) - $($fetchedUser.email) - Role: $($fetchedUser.role)" -ForegroundColor White
} catch {
    Write-Host "  - Failed to fetch user: $_" -ForegroundColor Red
}

# Step 6: Delete the test user
Write-Host "6. Deleting the test user..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Delete -Headers $headers
    Write-Host "  - User deleted successfully!" -ForegroundColor Green
    Write-Host "    * Response: $($deleteResponse.detail)" -ForegroundColor White
} catch {
    Write-Host "  - Failed to delete user: $_" -ForegroundColor Red
}

# Step 7: Confirm user deletion by trying to fetch it
Write-Host "7. Confirming deletion by trying to fetch the user..." -ForegroundColor Yellow
try {
    $deletedUser = Invoke-RestMethod -Uri "$API_URL/users/$testUserId" -Method Get -Headers $headers
    Write-Host "  - Warning: User still exists!" -ForegroundColor Yellow
    Write-Host "    * $($deletedUser.name) - $($deletedUser.email)" -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  - Success: User not found (404), confirming successful deletion." -ForegroundColor Green
    } else {
        Write-Host "  - Error fetching user: $_" -ForegroundColor Red
    }
}

Write-Host "`nAPI Testing Completed!" -ForegroundColor Cyan 