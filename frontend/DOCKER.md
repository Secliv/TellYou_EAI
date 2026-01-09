# Running Frontend dengan Docker

Panduan untuk menjalankan frontend menggunakan Docker Compose.

## Quick Start

### 1. Build dan Start Frontend

```bash
# Dari root directory project
docker compose up -d --build frontend
```

### 2. Akses Frontend

Frontend akan berjalan di: **http://localhost:5173**

### 3. Cek Status

```bash
docker compose ps frontend
```

### 4. Lihat Logs

```bash
docker compose logs -f frontend
```

## Konfigurasi

### Environment Variables

Frontend menggunakan environment variables untuk konfigurasi API endpoints. Di Docker, konfigurasi sudah di-set di `docker-compose.yml`:

```yaml
environment:
  - VITE_API_BASE_URL=http://localhost:3000
  - VITE_INVENTORY_API_URL=http://localhost:3001
  - VITE_PAYMENT_API_URL=http://localhost:3002
  - VITE_ORDER_API_URL=http://localhost:3003
```

**Catatan Penting:**
- Environment variables menggunakan `localhost` karena browser akan melakukan request dari client-side
- Vite proxy sudah dikonfigurasi untuk handle CORS dan routing
- Untuk development, semua services harus accessible dari browser (bukan dari dalam container)

### Vite Proxy Configuration

File `vite.config.js` sudah dikonfigurasi dengan proxy untuk development:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## Troubleshooting

### Frontend tidak bisa connect ke backend

1. **Pastikan semua services running:**
   ```bash
   docker compose ps
   ```

2. **Cek apakah backend services accessible:**
   ```bash
   curl http://localhost:3000/health  # User Service
   curl http://localhost:3001/health # Inventory Service
   ```

3. **Cek logs frontend:**
   ```bash
   docker compose logs frontend
   ```

### Port 5173 sudah digunakan

Jika port 5173 sudah digunakan, ubah di `docker-compose.yml`:

```yaml
ports:
  - "5174:5173"  # Gunakan port 5174 di host
```

### Hot reload tidak bekerja

Pastikan volume mount sudah benar:

```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules
```

Volume `/app/node_modules` memastikan node_modules tidak di-overwrite oleh host.

### Rebuild setelah perubahan dependencies

Jika menambah dependencies baru:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

## Development Workflow

### 1. Start semua services (termasuk frontend)

```bash
docker compose up -d
```

### 2. Start hanya frontend

```bash
docker compose up -d frontend
```

### 3. Restart frontend setelah perubahan

```bash
docker compose restart frontend
```

### 4. Rebuild frontend

```bash
docker compose build frontend
docker compose up -d frontend
```

## Production Build

Untuk production build di Docker, ubah Dockerfile:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Network Configuration

Frontend terhubung ke `shared-network` untuk komunikasi dengan backend services. Semua services yang perlu diakses oleh frontend harus berada di network yang sama.

## Tips

1. **Hot Reload**: Perubahan file akan otomatis reload di browser (karena volume mount)
2. **Logs**: Gunakan `docker compose logs -f frontend` untuk melihat real-time logs
3. **Debugging**: Buka browser DevTools untuk melihat network requests dan errors
4. **Environment**: Gunakan `.env` file untuk override environment variables jika perlu


