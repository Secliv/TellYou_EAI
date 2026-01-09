@echo off
echo ========================================
echo   Starting Tellyou EAI Services
echo ========================================

echo.
echo [1/6] Starting Docker databases...
docker compose up user-db inventory-db payment-db order-db -d
timeout /t 5 /nobreak > nul

echo.
echo [2/6] Starting User Service on port 3000...
start "User Service" cmd /c "cd provider-service\user-service && set PORT=3000 && set DB_HOST=localhost && set DB_PORT=5433 && set JWT_SECRET=your-secret-key-here && npm install 2>nul && node src/index.js"
timeout /t 2 /nobreak > nul

echo.
echo [3/6] Starting Inventory Service on port 3001...
start "Inventory Service" cmd /c "cd provider-service\inventory-service && set PORT=3001 && set DB_HOST=localhost && set DB_PORT=5434 && npm install 2>nul && node src/index.js"
timeout /t 2 /nobreak > nul

echo.
echo [4/6] Starting Payment Service on port 3002...
start "Payment Service" cmd /c "cd provider-service\payment-service && set PORT=3002 && set DB_HOST=localhost && set DB_PORT=5436 && npm install 2>nul && node src/index.js"
timeout /t 2 /nobreak > nul

echo.
echo [5/6] Starting Order Service on port 3003...
start "Order Service" cmd /c "cd customer-service\order-service && set PORT=3003 && set DB_HOST=localhost && set DB_PORT=5435 && npm install 2>nul && node src/index.js"
timeout /t 2 /nobreak > nul

echo.
echo [6/6] Starting Frontend on port 5173...
start "Frontend" cmd /c "cd frontend && npm install 2>nul && npx vite --host"

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Access URLs:
echo   Frontend:          http://localhost:5173
echo   User Service:      http://localhost:3000
echo   Inventory Service: http://localhost:3001/graphql
echo   Payment Service:   http://localhost:3002/graphql
echo   Order Service:     http://localhost:3003/graphql
echo.
echo Database Ports:
echo   User DB:      localhost:5433
echo   Inventory DB: localhost:5434
echo   Order DB:     localhost:5435
echo   Payment DB:   localhost:5436
echo.
pause
