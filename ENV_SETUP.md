# Environment Variables Setup Guide

Panduan untuk setup environment variables untuk semua microservices di project TELLYOU EAI.

## Quick Start

Setiap service memiliki file `.env.example` yang bisa di-copy menjadi `.env` untuk development lokal.

### Untuk Development Lokal (tanpa Docker)

1. Copy file `.env.example` menjadi `.env` di setiap service:
   ```bash
   # User Service
   cp provider-service/user-service/.env.example provider-service/user-service/.env
   
   # Inventory Service
   cp provider-service/inventory-service/.env.example provider-service/inventory-service/.env
   
   # Payment Service
   cp provider-service/payment-service/.env.example provider-service/payment-service/.env
   
   # Order Service
   cp customer-service/order-service/.env.example customer-service/order-service/.env
   
   # Stock-Payment Service
   cp customer-service/stock-payment-service/.env.example customer-service/stock-payment-service/.env
   ```

2. Edit file `.env` sesuai dengan konfigurasi database lokal Anda.

### Untuk Docker Compose

Environment variables sudah dikonfigurasi di `docker-compose.yml`. Jika ingin mengubah konfigurasi, edit file `docker-compose.yml` atau buat file `docker-compose.override.yml`.

## Environment Variables per Service

### User Service

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h
```

**Catatan**: 
- `JWT_SECRET` harus diubah di production dengan secret key yang kuat
- `JWT_EXPIRES_IN` menentukan berapa lama token JWT valid (default: 24h)

### Inventory Service

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### Payment Service

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### Order Service

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=order_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### Stock-Payment Service

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_payment_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## Database Host Configuration

### Development Lokal (tanpa Docker)
- `DB_HOST=localhost` - Gunakan ini jika database berjalan di localhost

### Docker Compose
- `DB_HOST=<service-name>-db` - Gunakan nama service database dari docker-compose.yml
  - User Service: `user-db`
  - Inventory Service: `inventory-db`
  - Payment Service: `payment-db`
  - Order Service: `order-db`
  - Stock-Payment Service: `stock-payment-db`

## Production Configuration

Untuk production, pastikan:

1. **Ganti semua password default** dengan password yang kuat
2. **Ganti JWT_SECRET** dengan secret key yang aman (minimal 32 karakter random)
3. **Set NODE_ENV=production**
4. **Gunakan environment variables dari hosting platform** (bukan hardcode di file)
5. **Jangan commit file .env** ke repository (sudah di-ignore di .gitignore)

## Generate Secure JWT Secret

Untuk generate JWT secret yang aman:

```bash
# Menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Atau menggunakan OpenSSL
openssl rand -hex 64
```

## Troubleshooting

### Database Connection Error

Jika mendapat error koneksi database:

1. **Development Lokal**: Pastikan PostgreSQL berjalan dan konfigurasi di `.env` benar
2. **Docker**: Pastikan container database sudah running:
   ```bash
   docker compose ps
   ```

### Port Already in Use

Jika port sudah digunakan:

1. Ubah `PORT` di file `.env`
2. Atau stop service yang menggunakan port tersebut:
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

## Environment Variables di Docker Compose

Semua environment variables untuk Docker sudah dikonfigurasi di `docker-compose.yml`. Untuk override tanpa mengubah file utama, buat file `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  user-service:
    environment:
      - JWT_SECRET=your-production-secret-here
```

File ini akan otomatis di-load oleh Docker Compose dan menggabungkan konfigurasi dengan `docker-compose.yml`.

