# Database Migration Guide

Panduan untuk menjalankan database migration untuk semua service di Tellyou---EAI-main.

## Service yang Memiliki Migration

1. **User Service** - `user-service`
   - Tables: `users`, `user_profiles`
   - Migrations: `001_create_users_table.sql`, `002_create_user_profiles_table.sql`

2. **Inventory Service** - `inventory-service`
   - Tables: `inventory`
   - Migration: `001_create_inventory_table.sql`

3. **Payment Service** - `payment-service`
   - Tables: `payments`
   - Migration: `001_create_payments_table.sql`

4. **Order Service** - `order-service`
   - Tables: `orders`
   - Migration: `001_create_orders_table.sql`

5. **Stock-Payment Service** - `stock-payment-service`
   - Tables: `fact_transactions`, `audit_logs`, `integration_status`
   - Migration: `001_init_tables.sql`

## Cara Menjalankan Migration

### Option 1: Menjalankan Semua Migration Sekaligus (Recommended)

```bash
cd "/Users/strange/Downloads/Tellyou---EAI-main"
bash scripts/run-all-migrations.sh
```

Script ini akan:
- ✅ Menjalankan migration untuk semua 5 service
- ✅ Menampilkan summary hasil migration
- ✅ Verifikasi tabel yang sudah dibuat

### Option 2: Menjalankan Migration Per Service

#### User Service
```bash
docker compose exec user-service node db/migrate.js
```

#### Inventory Service
```bash
docker compose exec inventory-service node db/migrate.js
```

#### Payment Service
```bash
docker compose exec payment-service node db/migrate.js
```

#### Order Service
```bash
docker compose exec order-service node db/migrate.js
```

#### Stock-Payment Service
```bash
docker compose exec stock-payment-service node db/migrate.js
```

## Verifikasi Migration

### Cek Tabel di Setiap Database

**User DB:**
```bash
docker compose exec user-db psql -U postgres -d user_db -c "\dt"
```

**Inventory DB:**
```bash
docker compose exec inventory-db psql -U postgres -d inventory_db -c "\dt"
```

**Payment DB:**
```bash
docker compose exec payment-db psql -U postgres -d payment_db -c "\dt"
```

**Order DB:**
```bash
docker compose exec order-db psql -U postgres -d order_db -c "\dt"
```

**Stock-Payment DB:**
```bash
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt"
```

## Troubleshooting

### Error: Container tidak berjalan

**Solusi:**
```bash
docker compose up -d <service-name> <service-db>
# Contoh:
docker compose up -d user-service user-db
```

### Error: Migration sudah dijalankan sebelumnya

**Catatan:** Migration script akan skip migration yang sudah dijalankan (tercatat di tabel `migrations`).

### Error: Permission denied

**Solusi:** Pastikan script memiliki permission execute:
```bash
chmod +x scripts/run-all-migrations.sh
```

## Expected Tables After Migration

### User Service
- `users`
- `user_profiles`
- `migrations`

### Inventory Service
- `inventory` (dengan 10 sample data)
- `migrations`

### Payment Service
- `payments`
- `migrations`

### Order Service
- `orders`
- `migrations`

### Stock-Payment Service
- `fact_transactions`
- `audit_logs`
- `integration_status`
- `schema_migrations`

## Catatan Penting

1. **Jalankan migration setelah container database siap** (healthcheck passed)
2. **Migration hanya perlu dijalankan sekali** (kecuali reset database)
3. **Sample data** akan otomatis di-insert untuk Inventory Service
4. **Migration tracking** menggunakan tabel `migrations` atau `schema_migrations` untuk mencegah duplicate execution

