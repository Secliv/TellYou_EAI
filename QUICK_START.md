# Quick Start Guide - TELLYOU EAI

Panduan cepat untuk memulai project TELLYOU EAI.

## Prerequisites

- Docker Desktop (atau Docker Engine + Docker Compose)
- Node.js 18+ (opsional, untuk development lokal)

## 1. Clone & Setup

```bash
# Clone repository (jika belum)
git clone <repository-url>
cd Tellyou---EAI-main

# Pastikan Docker Desktop berjalan
docker --version
docker compose version
```

## 2. Start All Services

```bash
# Build dan start semua services
docker compose up -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f
```

## 3. Run Database Migrations

```bash
# Migrate semua databases
npm run migrate

# Atau migrate service tertentu
npm run migrate:user
npm run migrate:inventory
npm run migrate:payment
npm run migrate:order
npm run migrate:stock-payment
```

## 4. Access Services

### GraphQL Playgrounds (Memerlukan JWT Token)

- **User Service**: http://localhost:3000/graphql
- **Inventory Service**: http://localhost:3001/graphql
- **Payment Service**: http://localhost:3002/graphql
- **Order Service**: http://localhost:3003/graphql
- **Stock-Payment Service**: http://localhost:3004/graphql

### REST API Endpoints

- **User Service**: http://localhost:3000
- **Inventory Service**: http://localhost:3001
- **Payment Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **Stock-Payment Service**: http://localhost:3004/api

### Frontend

- **Frontend (Docker)**: http://localhost:5174
- **Frontend (Local)**: http://localhost:5173

## 5. Get JWT Token (Authentication)

### Step 1: Register atau Login

Buka GraphQL Playground di **http://localhost:3000/graphql** dan jalankan:

```graphql
# Register (Public - tidak perlu token)
mutation {
  register(input: {
    username: "admin"
    email: "admin@example.com"
    password: "admin123"
    role: "admin"
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

ATAU

```graphql
# Login (Public - tidak perlu token)
mutation {
  login(input: {
    email: "admin@example.com"
    password: "admin123"
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

### Step 2: Simpan Token

Copy token dari response, contoh:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Gunakan Token di GraphQL Playground

1. Buka GraphQL Playground di service yang ingin diakses (misalnya http://localhost:3001/graphql)
2. Di bagian bawah, klik tab **"HTTP HEADERS"**
3. Tambahkan:
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

4. Sekarang Anda bisa menjalankan query/mutation yang memerlukan authentication

## 6. Test Query dengan Authentication

Setelah menambahkan token, coba query:

```graphql
# Di Inventory Service (http://localhost:3001/graphql)
query {
  inventories {
    success
    items {
      id
      name
      quantity
      price
    }
    total
  }
}

# Di Order Service (http://localhost:3003/graphql)
query {
  orders {
    success
    orders {
      id
      customerId
      status
      totalPrice
    }
    total
  }
}
```

## 7. Health Check

```bash
# Check semua services
curl http://localhost:3000/health  # User Service
curl http://localhost:3001/health  # Inventory Service
curl http://localhost:3002/health  # Payment Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Stock-Payment Service
```

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose stop

# Restart services
docker compose restart

# Rebuild services (setelah perubahan code)
docker compose build
docker compose up -d

# View logs
docker compose logs -f [service-name]

# Stop dan hapus containers
docker compose down

# Stop dan hapus containers + volumes (data akan hilang!)
docker compose down -v
```

## Troubleshooting

### Services tidak bisa diakses

1. Cek apakah containers running:
   ```bash
   docker compose ps
   ```

2. Cek logs untuk error:
   ```bash
   docker compose logs [service-name]
   ```

3. Rebuild containers:
   ```bash
   docker compose build [service-name]
   docker compose up -d [service-name]
   ```

### Authentication Error

1. Pastikan sudah login dan mendapatkan token
2. Pastikan token ditambahkan di HTTP HEADERS dengan format: `Bearer YOUR_TOKEN`
3. Pastikan `JWT_SECRET` sama di semua services (cek di docker-compose.yml)
4. Pastikan token belum expired (default: 24 jam)

### Database Connection Error

1. Pastikan database containers running:
   ```bash
   docker compose ps | grep db
   ```

2. Cek database logs:
   ```bash
   docker compose logs user-db
   ```

3. Restart database:
   ```bash
   docker compose restart user-db
   ```

## Next Steps

- Baca `README.md` untuk dokumentasi lengkap
- Baca `GRAPHQL_AUTH_GUIDE.md` untuk panduan authentication
- Baca `AUTHENTICATION_SUMMARY.md` untuk summary authentication
- Baca `STRUCTURE.md` untuk memahami arsitektur project

