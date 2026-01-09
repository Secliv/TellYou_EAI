# Testing Guide - User Service

Panduan lengkap untuk testing User Service API endpoints.

## Quick Test

Jalankan script test otomatis:

```bash
node scripts/test-user-service.js
```

Script akan menguji:
1. ✅ Health Check
2. ✅ User Registration
3. ✅ User Login
4. ✅ Get All Users (Protected)
5. ✅ Error Handling (Invalid Login)

## Manual Testing dengan cURL

### 1. Health Check

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

### 2. User Registration

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "role": "user"
  }'
```

**Expected Response (201):**
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

### 3. User Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response (200):**
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

### 4. Get All Users (Protected - Requires Token)

```bash
# Simpan token dari login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
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

### 5. Get User by ID (Protected)

```bash
curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Create User (Protected)

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "NewPassword123!",
    "role": "user"
  }'
```

### 7. Update User (Protected)

```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updateduser",
    "email": "updated@example.com"
  }'
```

### 8. Delete User (Protected)

```bash
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Get User Profile (Protected)

```bash
curl -X GET http://localhost:3000/users/1/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Update User Profile (Protected)

```bash
curl -X PUT http://localhost:3000/users/1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
  }'
```

## Testing dengan Postman

### Import Collection

1. Buka Postman
2. Create New Collection: "User Service API"
3. Tambahkan requests berikut:

#### Request 1: Health Check
- **Method:** GET
- **URL:** `http://localhost:3000/health`

#### Request 2: Register
- **Method:** POST
- **URL:** `http://localhost:3000/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "role": "user"
}
```

#### Request 3: Login
- **Method:** POST
- **URL:** `http://localhost:3000/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

#### Request 4: Get Users (Set Token)
- **Method:** GET
- **URL:** `http://localhost:3000/users`
- **Headers:** 
  - `Authorization: Bearer {{token}}`
- **Pre-request Script:** Simpan token dari Login response:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
}
```

## Error Responses

### 400 Bad Request (Missing Fields)
```json
{
  "success": false,
  "message": "Username, email, and password are required"
}
```

### 401 Unauthorized (Invalid Credentials)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 401 Unauthorized (No Token)
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 409 Conflict (User Already Exists)
```json
{
  "success": false,
  "message": "User already exists with this email or username"
}
```

## Testing Checklist

- [ ] Health check endpoint works
- [ ] User can register with valid data
- [ ] User cannot register with duplicate email/username
- [ ] User can login with correct credentials
- [ ] User cannot login with wrong credentials
- [ ] Protected endpoints require valid token
- [ ] Protected endpoints reject requests without token
- [ ] Protected endpoints reject requests with invalid token
- [ ] Get all users returns list of users
- [ ] Get user by ID returns correct user
- [ ] Create user works (admin only)
- [ ] Update user works
- [ ] Delete user works
- [ ] User profile endpoints work

## Troubleshooting

### Service Not Running
```bash
# Check if service is running
docker compose ps

# Or check health
curl http://localhost:3000/health
```

### Database Connection Error
```bash
# Check database is running
docker compose ps | grep user-db

# Check logs
docker compose logs user-service
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Stop conflicting service or change port in .env
```

