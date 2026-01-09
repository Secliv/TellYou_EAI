# Setup Guide - TELLYOU EAI Project

## Instalasi Docker untuk macOS

### Opsi 1: Docker Desktop (Recommended)

1. **Download Docker Desktop**
   - Kunjungi: https://www.docker.com/products/docker-desktop/
   - Pilih versi untuk Mac (Intel atau Apple Silicon sesuai dengan Mac Anda)
   - Download file `.dmg`

2. **Install Docker Desktop**
   - Buka file `.dmg` yang sudah didownload
   - Drag Docker icon ke Applications folder
   - Buka Docker dari Applications
   - Ikuti wizard setup (masukkan password jika diminta)

3. **Verifikasi Instalasi**
   ```bash
   docker --version
   docker compose version
   ```

4. **Start Docker Desktop**
   - Pastikan Docker Desktop berjalan (icon Docker di menu bar)
   - Tunggu hingga status "Docker Desktop is running"

### Opsi 2: Install via Homebrew

```bash
# Install Homebrew jika belum ada
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop via Homebrew
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

## Menjalankan Project

Setelah Docker terinstall dan berjalan:

```bash
# Masuk ke direktori project
cd /Users/strange/tellyou_eai

# Build dan jalankan semua services
docker compose up -d

# Atau jika menggunakan versi lama docker-compose
docker-compose up -d
```

## Troubleshooting

### Error: "command not found: docker-compose"

**Solusi 1**: Gunakan `docker compose` (tanpa dash) - ini adalah versi baru
```bash
docker compose up -d
```

**Solusi 2**: Install docker-compose standalone
```bash
# Via Homebrew
brew install docker-compose
```

### Error: "Cannot connect to the Docker daemon"

- Pastikan Docker Desktop sedang berjalan
- Cek status Docker: `docker ps`
- Restart Docker Desktop jika perlu

### Error: "Port already in use"

- Cek port yang digunakan: `lsof -i :3000`
- Stop service yang menggunakan port tersebut
- Atau ubah port di `docker-compose.yml`

## Verifikasi Services Berjalan

```bash
# Cek status containers
docker compose ps

# Cek logs semua services
docker compose logs

# Cek logs service tertentu
docker compose logs user-service
docker compose logs inventory-service
```

## Akses Services

Setelah semua services berjalan, akses melalui:

### REST API Endpoints
- **User Service**: http://localhost:3000
- **Inventory Service**: http://localhost:3001
- **Payment Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **Stock-Payment Service**: http://localhost:3004/api

### GraphQL Endpoints (Memerlukan JWT Token)
- **User Service GraphQL**: http://localhost:3000/graphql
- **Inventory Service GraphQL**: http://localhost:3001/graphql
- **Payment Service GraphQL**: http://localhost:3002/graphql
- **Order Service GraphQL**: http://localhost:3003/graphql
- **Stock-Payment Service GraphQL**: http://localhost:3004/graphql

### Frontend
- **Frontend (Docker)**: http://localhost:5174
- **Frontend (Local)**: http://localhost:5173

**⚠️ PENTING**: Semua GraphQL endpoints memerlukan JWT token untuk authentication. Lihat `GRAPHQL_AUTH_GUIDE.md` untuk panduan lengkap.

## Development Mode

Untuk development, Anda bisa menjalankan service secara individual tanpa Docker:

```bash
# Masuk ke direktori service
cd provider-service/user-service

# Install dependencies
npm install

# Jalankan dengan nodemon (auto-reload)
npm run dev
```

Pastikan database sudah berjalan terlebih dahulu atau gunakan database lokal.

