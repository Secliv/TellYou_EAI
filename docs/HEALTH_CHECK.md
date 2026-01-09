# Health Check Guide

Panduan lengkap untuk melakukan health check pada semua service, database, dan GraphQL endpoints di TELLYOU EAI.

## Quick Start

### 1. Quick Check (Bash Script)
Untuk pengecekan cepat status service:

```bash
npm run check
# atau
bash scripts/quick-check.sh
```

Script ini akan menampilkan:
- Status Docker containers
- Health check semua service
- URL GraphQL endpoints
- Port database

### 2. Comprehensive Health Check (Node.js Script)
Untuk pengecekan lengkap dan detail:

```bash
npm run health-check
# atau
node scripts/health-check.js
```

## Apa yang Dicek?

### 1. ✅ Docker Container Status
- Mengecek status semua container yang berjalan
- Menampilkan container name, status, dan port mapping
- Memverifikasi semua service container berjalan dengan baik

**Expected Output:**
```
✅ user-service: Running
✅ inventory-service: Running
✅ payment-service: Running
✅ order-service: Running
✅ stock-payment-service: Running
```

### 2. ✅ Service Health Checks (REST APIs)
Mengecek health endpoint semua service:

- **User Service**: `http://localhost:3000/health`
- **Inventory Service**: `http://localhost:3001/health`
- **Payment Service**: `http://localhost:3002/health`
- **Order Service**: `http://localhost:3003/health`
- **Stock-Payment Service**: `http://localhost:3004/health`

**Expected Response:**
```json
{
  "status": "ok",
  "service": "user-service"
}
```

### 3. ✅ GraphQL Endpoint Checks
Mengecek koneksi dan schema GraphQL:

- **Inventory Service**: `http://localhost:3001/graphql`
- **Payment Service**: `http://localhost:3002/graphql`
- **Order Service**: `http://localhost:3003/graphql`
- **Stock-Payment Service**: `http://localhost:3004/graphql`

Script akan:
- Test GraphQL introspection query
- Menampilkan query type, mutation type, dan jumlah types
- Verifikasi Apollo Sandbox dapat diakses

### 4. ✅ GraphQL Query Tests
Menguji query GraphQL pada setiap service:

**Inventory Service:**
```graphql
query {
  inventories {
    id
    name
    category
    stock
  }
}
```

**Payment Service:**
```graphql
query {
  payments {
    id
    orderId
    amount
    status
  }
}
```

**Order Service:**
```graphql
query {
  orders {
    id
    customerId
    status
    totalPrice
  }
}
```

**Stock-Payment Service:**
```graphql
query {
  transactions {
    id
    type
    status
  }
}
```

### 5. ✅ PostgreSQL Database Connections
Mengecek koneksi ke semua database:

| Service | Database | Host | Port |
|---------|----------|------|------|
| User Service | user_db | localhost | 5433 |
| Inventory Service | inventory_db | localhost | 5434 |
| Payment Service | payment_db | localhost | 5436 |
| Order Service | order_db | localhost | 5435 |
| Stock-Payment Service | stock_payment_db | (internal only) | - |

**Note:** Stock-Payment database tidak memiliki port mapping, hanya dapat diakses dari dalam Docker network. Koneksi database dapat diverifikasi melalui health endpoint service.

### 6. ✅ Service Integration Verification
Mengecek komunikasi antar service:
- User Service → Inventory Service
- Order Service → Payment Service
- Frontend → Backend Services

## GraphQL Playground (Apollo Sandbox)

Semua service dengan GraphQL menggunakan Apollo Server dengan Apollo Sandbox yang dapat diakses langsung di browser:

1. **Inventory Service GraphQL Playground**
   - URL: `http://localhost:3001/graphql`
   - Buka di browser untuk interactive GraphQL query testing

2. **Payment Service GraphQL Playground**
   - URL: `http://localhost:3002/graphql`
   - Buka di browser untuk interactive GraphQL query testing

3. **Order Service GraphQL Playground**
   - URL: `http://localhost:3003/graphql`
   - Buka di browser untuk interactive GraphQL query testing

4. **Stock-Payment Service GraphQL**
   - URL: `http://localhost:3004/graphql`
   - GraphiQL UI: `http://localhost:3004/graphiql` (development mode)

## Troubleshooting

### Service Tidak Merespons

**Problem:** Service health check gagal dengan `ECONNREFUSED`

**Solution:**
```bash
# Cek status container
docker compose ps

# Restart service
docker compose restart <service-name>

# Lihat logs
docker compose logs -f <service-name>
```

### Database Connection Error

**Problem:** Database connection failed

**Solution:**
```bash
# Cek database container running
docker compose ps | grep -db

# Restart database
docker compose restart <service>-db

# Cek logs database
docker compose logs <service>-db
```

### GraphQL Endpoint Tidak Bisa Diakses

**Problem:** GraphQL introspection query gagal

**Solution:**
1. Pastikan service berjalan: `docker compose ps`
2. Cek logs service: `docker compose logs <service-name>`
3. Verifikasi Apollo Server sudah start (lihat logs)
4. Coba akses GraphQL Playground di browser

### Port Already in Use

**Problem:** Port sudah digunakan oleh aplikasi lain

**Solution:**
```bash
# Cek apa yang menggunakan port
lsof -i :3000  # untuk port 3000, ganti dengan port yang bermasalah

# Stop aplikasi yang menggunakan port, atau
# Ubah port di docker-compose.yml
```

## Manual Testing

### Test Health Endpoint dengan curl

```bash
# User Service
curl http://localhost:3000/health

# Inventory Service
curl http://localhost:3001/health

# Payment Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Stock-Payment Service
curl http://localhost:3004/health
```

### Test GraphQL dengan curl

```bash
# Inventory Service
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ inventories { id name stock } }"}'

# Payment Service
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ payments { id orderId amount status } }"}'

# Order Service
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ orders { id customerId status totalPrice } }"}'
```

### Test Database Connection

```bash
# User Database
psql -h localhost -p 5433 -U postgres -d user_db

# Inventory Database
psql -h localhost -p 5434 -U postgres -d inventory_db

# Payment Database
psql -h localhost -p 5436 -U postgres -d payment_db

# Order Database
psql -h localhost -p 5435 -U postgres -d order_db
```

Password default: `postgres`

## Monitoring Docker Containers

### Cek Status Semua Container
```bash
docker compose ps
```

### Lihat Logs Real-time
```bash
# Semua services
docker compose logs -f

# Service tertentu
docker compose logs -f user-service
docker compose logs -f inventory-service
```

### Restart Service
```bash
# Restart semua
docker compose restart

# Restart service tertentu
docker compose restart user-service
```

### Stop/Start Services
```bash
# Stop semua
docker compose stop

# Start semua
docker compose up -d

# Stop dan hapus containers
docker compose down
```

## Summary Report

Setelah menjalankan comprehensive health check, script akan menampilkan summary:

- ✅ Total Services: 5
- ✅ Healthy Services: 5/5
- ✅ GraphQL Endpoints: 4/4
- ✅ Database Connections: 4/4

Jika semua sistem sehat, akan menampilkan:
```
✅ All systems operational! 🎉
```

## Best Practices

1. **Jalankan health check setelah:**
   - Start semua services
   - Restart services
   - Update code atau configuration
   - Troubleshooting issues

2. **Monitor secara berkala:**
   - Setiap kali development session dimulai
   - Sebelum melakukan testing
   - Setelah deployment

3. **Gunakan quick check untuk:**
   - Pengecekan cepat status
   - Verifikasi service running

4. **Gunakan comprehensive check untuk:**
   - Troubleshooting masalah
   - Verifikasi lengkap sebelum demo/deployment
   - Testing setelah perubahan besar

## Script Files

- `scripts/health-check.js` - Comprehensive Node.js health check script
- `scripts/quick-check.sh` - Quick bash health check script

## Dependencies

Health check script memerlukan:
- `axios` - Untuk HTTP requests
- `pg` - Untuk PostgreSQL connections

Install dengan:
```bash
npm install
```

