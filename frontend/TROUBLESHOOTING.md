# Troubleshooting Frontend Integration

## Masalah: Login/Register Failed

### 1. Cek CORS Configuration

Pastikan backend sudah mengizinkan request dari frontend. User Service sudah dikonfigurasi dengan CORS untuk:
- `http://localhost:5173` (Frontend)
- `http://localhost:3000` (Backend)

### 2. Cek Network Connection

**Test backend API langsung:**
```bash
# Test register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Cek Browser Console

Buka browser DevTools (F12) dan cek:
- **Console tab**: Lihat error messages
- **Network tab**: Lihat request/response details
- **CORS errors**: Biasanya muncul sebagai "CORS policy" error

### 4. Cek Environment Variables

Pastikan `VITE_API_BASE_URL` sudah benar di frontend:

**Di Docker:**
```yaml
environment:
  - VITE_API_BASE_URL=http://localhost:3000
```

**Di Local Development:**
Buat file `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 5. Rebuild Services

Jika ada perubahan di backend:

```bash
# Rebuild user-service
docker compose build user-service
docker compose up -d user-service

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### 6. Cek Logs

```bash
# Backend logs
docker compose logs -f user-service

# Frontend logs
docker compose logs -f frontend
```

## Common Errors

### Error: "Network Error" atau "Failed to fetch"

**Kemungkinan penyebab:**
1. Backend tidak running
2. CORS tidak dikonfigurasi
3. URL API salah

**Solusi:**
1. Cek `docker compose ps` - pastikan user-service running
2. Pastikan CORS sudah dikonfigurasi di backend
3. Cek `VITE_API_BASE_URL` di frontend

### Error: "401 Unauthorized"

**Kemungkinan penyebab:**
1. Token expired atau invalid
2. Token tidak dikirim dengan benar

**Solusi:**
1. Clear localStorage dan login lagi
2. Cek apakah token dikirim di Authorization header

### Error: "500 Internal Server Error"

**Kemungkinan penyebab:**
1. Database error
2. Backend code error

**Solusi:**
1. Cek backend logs: `docker compose logs user-service`
2. Pastikan database sudah di-migrate
3. Cek database connection

## Testing Steps

1. **Test Backend API:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test Register dari curl:**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"test123","role":"user"}'
   ```

3. **Test dari Browser:**
   - Buka http://localhost:5173
   - Buka DevTools (F12)
   - Coba register/login
   - Lihat Network tab untuk melihat request/response

4. **Cek CORS Headers:**
   ```bash
   curl -X OPTIONS http://localhost:3000/auth/register \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

## Debug Mode

Aktifkan console logging di frontend untuk melihat detail error:

File sudah include `console.error` di Login.jsx dan Register.jsx untuk debugging.

## Still Having Issues?

1. Pastikan semua services running: `docker compose ps`
2. Cek semua logs: `docker compose logs`
3. Restart semua services: `docker compose restart`
4. Rebuild semua: `docker compose build --no-cache`




