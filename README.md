# TELLYOU EAI Project

Sistem manajemen bahan kue dengan arsitektur microservices yang terdiri dari 2 container besar: Provider-Service dan Customer-Service.

> **🚀 Quick Start**: Lihat [`QUICK_START.md`](./QUICK_START.md) untuk panduan cepat memulai project.  
> **🔐 Authentication**: Semua GraphQL endpoints memerlukan JWT token. Lihat [`GRAPHQL_AUTH_GUIDE.md`](./GRAPHQL_AUTH_GUIDE.md) untuk panduan lengkap.

## Arsitektur Sistem

### Provider-Service (Container Besar)
1. **User Service** - Menangani data pengguna (autentikasi, autorisasi, dan manajemen profil)
2. **Inventory Management Service** - Mengelola bahan kue, memperbarui stok, dan menangani pesanan
3. **Payment Processing Service** - Memproses pembayaran dari toko kue

### Customer-Service (Container Besar)
1. **Order Management Service** - Menangani pemesanan dan melacak status pesanan
2. **Stock and Payment Update Service** - Mengupdate stok dan memproses pembayaran

## Prinsip Database

Setiap microservice memiliki database terpisah (1 layanan 1 database) untuk isolasi data dan mengurangi ketergantungan antar layanan.

## Struktur Project

```
/project-root
├── /provider-service
│   ├── /user-service
│   ├── /inventory-service
│   └── /payment-service
├── /customer-service
│   ├── /order-service
│   └── /stock-payment-service
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Docker Desktop (atau Docker Engine + Docker Compose)
- Node.js 18+ (untuk development lokal)
- PostgreSQL (untuk development lokal, atau gunakan Docker)

## Features

- ✅ **JWT Authentication** - Semua GraphQL endpoints memerlukan authentication
- ✅ **Role-Based Access Control** - Admin dan User roles dengan permission berbeda
- ✅ **GraphQL API** - Semua services memiliki GraphQL endpoint
- ✅ **REST API** - Backward compatibility dengan REST endpoints
- ✅ **Microservices Architecture** - Setiap service dapat di-deploy secara independen
- ✅ **Database Isolation** - Setiap service memiliki database terpisah

## Frontend

Frontend application tersedia di folder `frontend/` menggunakan React + Vite.

**Quick Start:**
```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di http://localhost:5173

Lihat `frontend/README.md` untuk dokumentasi lengkap.

### Install Docker Desktop

1. Download Docker Desktop dari: https://www.docker.com/products/docker-desktop/
2. Install dan jalankan Docker Desktop
3. Verifikasi instalasi:
   ```bash
   docker --version
   docker compose version
   ```

## Setup Environment Variables

### Untuk Development Lokal (tanpa Docker)

Jalankan script setup untuk membuat file `.env` di semua services:

```bash
# Menggunakan Node.js script (recommended)
node scripts/setup-env.js

# Atau menggunakan bash script
bash scripts/setup-env.sh
```

Script akan membuat file `.env` di setiap service dengan konfigurasi default. Edit file `.env` sesuai kebutuhan Anda.

**Catatan Penting:**
- Untuk development lokal, gunakan `DB_HOST=localhost`
- Untuk Docker Compose, environment variables sudah dikonfigurasi di `docker-compose.yml`
- JWT_SECRET akan otomatis di-generate oleh script (untuk user-service)
- Lihat `ENV_SETUP.md` untuk dokumentasi lengkap tentang environment variables

### Untuk Docker Compose

Environment variables sudah dikonfigurasi di `docker-compose.yml`. Tidak perlu setup manual jika menggunakan Docker Compose.

## Menjalankan Database Migrations

Setelah environment variables di-setup, jalankan migrations untuk membuat tabel database:

```bash
# Migrate semua services yang memiliki migrations
npm run migrate

# Migrate service tertentu (contoh: user-service)
npm run migrate:user

# Atau langsung dari service directory
cd provider-service/user-service
npm run migrate
```

**Catatan:**
- Pastikan database sudah berjalan sebelum menjalankan migrations
- Untuk Docker: `docker compose up -d` akan start semua database
- Untuk development lokal: Pastikan PostgreSQL berjalan dan konfigurasi di `.env` benar
- Script akan otomatis install dependencies jika belum terinstall

## Development Mode

### ⚠️ PENTING: Pilih Salah Satu Mode

**Jangan campur antara Docker mode dan Local development mode!**

### Mode 1: Docker Compose (Recommended - Sudah Running)

Jika menggunakan Docker Compose, **semua service sudah otomatis running**. Tidak perlu manual start!

```bash
# Cek status semua services
docker compose ps

# Lihat logs service tertentu
docker compose logs -f user-service

# Restart service tertentu jika perlu
docker compose restart user-service
```

**Keuntungan:**
- ✅ Semua service sudah running otomatis
- ✅ Database sudah terhubung
- ✅ Port mapping sudah dikonfigurasi
- ✅ Tidak perlu install dependencies lokal

**Akses services:**
- **User Service**: 
  - REST API: http://localhost:3000
  - GraphQL: http://localhost:3000/graphql
- **Inventory Service**: 
  - REST API: http://localhost:3001
  - GraphQL: http://localhost:3001/graphql
- **Payment Service**: 
  - REST API: http://localhost:3002
  - GraphQL: http://localhost:3002/graphql
- **Order Service**: 
  - REST API: http://localhost:3003
  - GraphQL: http://localhost:3003/graphql
- **Stock-Payment Service**: 
  - REST API: http://localhost:3004/api
  - GraphQL: http://localhost:3004/graphql
- **Frontend**: http://localhost:5174 (Docker) atau http://localhost:5173 (local)

### Mode 2: Local Development (Tanpa Docker)

Hanya gunakan jika ingin development lokal tanpa Docker:

```bash
# Stop Docker terlebih dahulu (jika running)
docker compose down

# Jalankan service tertentu
npm run dev user-service
npm run dev inventory-service
npm run dev payment-service
npm run dev order-service
npm run dev stock-payment-service

# Atau langsung dari service directory
cd provider-service/user-service
npm run dev
```

**Catatan untuk Local Development:**
- Pastikan PostgreSQL berjalan di localhost
- Pastikan file `.env` sudah dikonfigurasi dengan benar (`DB_HOST=localhost`)
- Script akan otomatis install dependencies jika belum terinstall
- Development mode menggunakan `nodemon` untuk auto-reload saat file berubah

## Menjalankan Project

### Menggunakan Docker Compose (Recommended)

```bash
# Start semua services
docker compose up -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f
```

> **Catatan Penting**: Flag `-d` (detached mode) membuat containers berjalan di background. 
> - ✅ **Containers TIDAK akan mati** saat terminal ditutup
> - ✅ **Containers akan terus berjalan** sampai Docker Desktop dihentikan atau containers dihentikan manual
> - ✅ **Containers akan otomatis start** saat Docker Desktop dijalankan (jika sudah pernah di-start sebelumnya)
> - ⚠️ Containers akan mati jika: Docker Desktop dihentikan, system shutdown/restart, atau dihentikan manual
> - ✅ **Semua service sudah running** - tidak perlu manual start dengan `npm run dev`

### Melihat status containers
```bash
docker compose ps
```

### Melihat logs
```bash
# Logs semua services
docker compose logs -f

# Logs service tertentu
docker compose logs -f user-service
```

### Menghentikan services
```bash
# Menghentikan containers (tapi tidak menghapus)
docker compose stop

# Menghentikan dan menghapus containers
docker compose down
```

### Menghentikan dan menghapus volumes (data akan hilang!)
```bash
docker compose down -v
```

### Restart services
```bash
docker compose restart
```

## Endpoints

### ⚠️ PENTING: Authentication Required

**Semua GraphQL endpoints memerlukan JWT token** (kecuali `register` dan `login` di user-service).

Lihat `GRAPHQL_AUTH_GUIDE.md` dan `AUTHENTICATION_SUMMARY.md` untuk panduan lengkap.

### User Service (Port 3000)
**REST API:**
- GET /users - Mendapatkan daftar pengguna (requires auth)
- GET /users/{id} - Mendapatkan detail pengguna (requires auth)
- POST /users - Membuat pengguna baru (requires admin)
- PUT /users/{id} - Memperbarui data pengguna (requires auth)
- DELETE /users/{id} - Menghapus pengguna (requires admin)
- POST /auth/login - Login pengguna (public)
- POST /auth/register - Registrasi pengguna baru (public)

**GraphQL:** `http://localhost:3000/graphql`
- Query: `me`, `users` (admin), `user`, `userProfile`
- Mutation: `register` (public), `login` (public), `createUser` (admin), `updateUser`, `deleteUser` (admin), `updateUserProfile`

### Inventory Management Service (Port 3001)
**REST API:**
- GET /inventories - Mendapatkan daftar bahan kue (requires auth)
- POST /update-stock - Memperbarui stok bahan kue (requires auth)

**GraphQL:** `http://localhost:3001/graphql`
- Query: `inventories`, `inventory`, `inventoryStats`, `lowStockItems` (all require auth)
- Mutation: `createInventory` (admin), `updateInventory` (admin), `updateStock` (auth), `deleteInventory` (admin)

### Payment Processing Service (Port 3002)
**REST API:**
- POST /payment - Membuat pembayaran (requires auth)
- GET /payment-status - Memeriksa status pembayaran (requires auth)

**GraphQL:** `http://localhost:3002/graphql`
- Query: `payments`, `payment`, `paymentByOrder`, `paymentStats` (admin)
- Mutation: `createPayment` (auth), `confirmPayment` (admin), `updatePaymentStatus` (admin)

### Order Management Service (Port 3003)
**REST API:**
- POST /order - Membuat pesanan (requires auth)
- GET /order/{id} - Menampilkan status pesanan (requires auth)
- GET /orders - Mendapatkan daftar pesanan (requires auth)
- PUT /order/{id}/status - Update status pesanan (requires auth/admin)

**GraphQL:** `http://localhost:3003/graphql`
- Query: `order`, `orders`, `orderStatus` (all require auth)
- Mutation: `createOrder` (auth), `updateOrderStatus` (auth/admin), `updateOrder` (auth), `cancelOrder` (auth), `deleteOrder` (admin)

### Stock and Payment Update Service (Port 3004)
**REST API:**
- POST /api/transactions - Membuat transaksi (requires auth)
- GET /api/transactions - Mendapatkan daftar transaksi (requires auth)

**GraphQL:** `http://localhost:3004/graphql`
- Query: `transactions`, `transaction`, `statistics` (admin)
- Mutation: `createTransaction` (auth), `confirmPayment` (admin)

## Authentication & Authorization

**Semua GraphQL endpoints memerlukan JWT token** untuk autentikasi. Hanya `register` dan `login` di user-service yang public.

### Quick Start dengan Authentication

1. **Login/Register untuk mendapatkan token:**
   ```bash
   # Via GraphQL (Recommended)
   # Buka http://localhost:3000/graphql dan jalankan:
   ```
   ```graphql
   mutation {
     login(input: {
       email: "admin@example.com"
       password: "password123"
     }) {
       success
       token
       user {
         id
         email
         role
       }
     }
   }
   ```

2. **Gunakan token di GraphQL Playground:**
   - Buka GraphQL Playground di service yang ingin diakses
   - Di tab "HTTP HEADERS", tambahkan:
   ```json
   {
     "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
   }
   ```

3. **Atau via REST API:**
   ```bash
   curl -X GET http://localhost:3000/users \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

**Lihat dokumentasi lengkap:**
- `GRAPHQL_AUTH_GUIDE.md` - Panduan lengkap GraphQL authentication
- `AUTHENTICATION_SUMMARY.md` - Summary authentication untuk semua services

## Testing Services

### Test User Service (Login & Register)

Lihat dokumentasi lengkap di `provider-service/user-service/TESTING.md`

**Quick Test dengan curl:**

```bash
# 1. Register user baru (REST API)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'

# 2. Login (REST API)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. Get all users (gunakan token dari response login)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Health Check semua services:**
```bash
curl http://localhost:3000/health  # User Service
curl http://localhost:3001/health  # Inventory Service
curl http://localhost:3002/health  # Payment Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Stock-Payment Service
```

### Test GraphQL dengan Authentication

Buka GraphQL Playground di browser:
- User Service: http://localhost:3000/graphql
- Inventory Service: http://localhost:3001/graphql
- Payment Service: http://localhost:3002/graphql
- Order Service: http://localhost:3003/graphql
- Stock-Payment Service: http://localhost:3004/graphql

**Pastikan untuk menambahkan Authorization header dengan token JWT!**

## Dokumentasi Lengkap

- **QUICK_START.md** - Panduan cepat memulai project
- **GRAPHQL_AUTH_GUIDE.md** - Panduan lengkap GraphQL authentication
- **AUTHENTICATION_SUMMARY.md** - Summary authentication untuk semua services
- **STRUCTURE.md** - Struktur dan arsitektur project
- **SETUP.md** - Panduan setup Docker dan environment
- **ENV_SETUP.md** - Panduan setup environment variables
- **docs/TESTING.md** - Panduan testing services

## Port Summary

| Service | Port | GraphQL | REST API | Database Port |
|---------|------|---------|----------|--------------|
| User Service | 3000 | ✅ | ✅ | 5438 |
| Inventory Service | 3001 | ✅ | ✅ | 5434 |
| Payment Service | 3002 | ✅ | ✅ | 5436 |
| Order Service | 3003 | ✅ | ✅ | 5435 |
| Stock-Payment Service | 3004 | ✅ | ✅ | 5437 |
| Frontend | 5174/5173 | - | - | - |

## Technology Stack

- **Backend**: Node.js, Express.js
- **GraphQL**: Apollo Server 4
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Token)
- **Containerization**: Docker, Docker Compose
- **Frontend**: React, Vite

## License

ISC
