# Testing User Service

Panduan untuk test User Service API endpoints, khususnya untuk login dan register.

## Prerequisites

1. Pastikan User Service sudah running:
   ```bash
   # Cek dengan Docker
   docker compose ps | grep user-service
   
   # Atau test health endpoint
   curl http://localhost:3000/health
   ```

2. Pastikan database sudah di-migrate:
   ```bash
   npm run migrate:user
   ```

## Base URL

- **Docker**: `http://localhost:3000`
- **Local Development**: `http://localhost:3000` (atau port yang dikonfigurasi)

## Endpoints Testing

### 1. Health Check

Test apakah service running:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "user-service"
}
```

### 2. Register (Registrasi User Baru)

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "role": "user"
}
```

**Contoh dengan curl:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Expected Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "createdAt": "2025-12-19T00:00:00.000Z",
      "updatedAt": "2025-12-19T00:00:00.000Z"
    }
  }
}
```

**Error Response (409 - User already exists):**
```json
{
  "success": false,
  "message": "User already exists with this email or username"
}
```

### 3. Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Contoh dengan curl:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "createdAt": "2025-12-19T00:00:00.000Z",
      "updatedAt": "2025-12-19T00:00:00.000Z"
    }
  }
}
```

**Error Response (401 - Invalid credentials):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 4. Get All Users (Protected - Requires JWT Token)

**Endpoint:** `GET /users`

**Contoh dengan curl:**
```bash
# Simpan token dari response login/register
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "createdAt": "2025-12-19T00:00:00.000Z",
      "updatedAt": "2025-12-19T00:00:00.000Z"
    }
  ]
}
```

### 5. Get User by ID (Protected - Requires JWT Token)

**Endpoint:** `GET /users/:id`

**Contoh dengan curl:**
```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Complete Test Flow

Berikut adalah contoh complete test flow dari register sampai login:

```bash
# 1. Register user baru
echo "=== Register User ==="
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token (jika menggunakan jq)
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')

# 2. Login dengan credentials yang sama
echo -e "\n=== Login User ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token dari login
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

# 3. Get all users menggunakan token
echo -e "\n=== Get All Users ==="
curl -s -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Get user by ID
echo -e "\n=== Get User by ID ==="
curl -s -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Testing dengan Postman atau Insomnia

### Import Collection

Anda bisa import collection berikut ke Postman atau Insomnia:

**Base URL:** `http://localhost:3000`

**Endpoints:**
1. `POST /auth/register` - Register user baru
2. `POST /auth/login` - Login user
3. `GET /users` - Get all users (requires Bearer token)
4. `GET /users/:id` - Get user by ID (requires Bearer token)
5. `POST /users` - Create user (requires Bearer token)
6. `PUT /users/:id` - Update user (requires Bearer token)
7. `DELETE /users/:id` - Delete user (requires Bearer token)

**Headers untuk Protected Endpoints:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Testing dengan Script

Buat file `test-user-service.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing User Service API"
echo "=========================="

# Test 1: Health Check
echo -e "\n1. Health Check"
curl -s "$BASE_URL/health" | jq '.'

# Test 2: Register
echo -e "\n2. Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Register failed!"
  exit 1
fi

echo "✅ Register successful! Token: ${TOKEN:0:50}..."

# Test 3: Login
echo -e "\n3. Login User"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:50}..."

# Test 4: Get All Users
echo -e "\n4. Get All Users"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n✅ All tests completed!"
```

Jalankan dengan:
```bash
chmod +x test-user-service.sh
./test-user-service.sh
```

## Common Issues

### 1. Connection Refused
- Pastikan service sudah running: `docker compose ps`
- Cek port: `lsof -i :3000`

### 2. Invalid Token
- Pastikan menggunakan token yang valid dari response login/register
- Token format: `Bearer <token>`

### 3. User Already Exists
- Gunakan email/username yang berbeda
- Atau hapus user yang sudah ada dari database

### 4. Database Connection Error
- Pastikan database sudah running
- Cek konfigurasi di `.env` atau `docker-compose.yml`

