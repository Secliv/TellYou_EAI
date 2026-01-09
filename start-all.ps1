# ============================================
# Script untuk menjalankan semua services
# Jalankan dengan: .\start-all.ps1
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Tellyou EAI Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Start Docker databases
Write-Host "`n[1/4] Starting Docker databases..." -ForegroundColor Yellow
docker compose up user-db order-db -d
Start-Sleep -Seconds 3

# Step 2: Start User Service
Write-Host "`n[2/4] Starting User Service on port 3000..." -ForegroundColor Yellow
$userServiceJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\provider-service\user-service
    $env:PORT = "3000"
    $env:DB_HOST = "localhost"
    $env:DB_PORT = "5433"
    $env:JWT_SECRET = "your-secret-key-here"
    node src/index.js
}
Start-Sleep -Seconds 2

# Step 3: Start Order Service
Write-Host "`n[3/4] Starting Order Service on port 3003..." -ForegroundColor Yellow
$orderServiceJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\customer-service\order-service
    $env:PORT = "3003"
    $env:DB_HOST = "localhost"
    $env:DB_PORT = "5435"
    node src/index.js
}
Start-Sleep -Seconds 2

# Step 4: Start Frontend
Write-Host "`n[4/4] Starting Frontend on port 5173..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npx vite --host
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "  User Service:  http://localhost:3000" -ForegroundColor White
Write-Host "  Order Service: http://localhost:3003" -ForegroundColor White
Write-Host "  GraphQL:       http://localhost:3003/graphql" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running and show logs
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
}
finally {
    Write-Host "`nStopping all services..." -ForegroundColor Red
    Stop-Job $userServiceJob, $orderServiceJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $userServiceJob, $orderServiceJob, $frontendJob -ErrorAction SilentlyContinue
}




