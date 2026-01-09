# Stock-Payment Service Database Troubleshooting

Panduan untuk mengatasi masalah database pada Stock-Payment Service.

## Masalah Umum

### 1. Error: "relation does not exist"

**Penyebab:**
- Migration belum dijalankan
- Tabel belum dibuat di database

**Solusi:**
```bash
# Jalankan migration
docker compose exec stock-payment-service node db/migrate.js

# Verifikasi tabel sudah dibuat
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt"
```

### 2. Error: Foreign Key Constraint Violation

**Penyebab:**
- Foreign key constraint pada `audit_logs` dan `integration_status` reference ke `fact_transactions(transaction_id)`
- Data yang di-insert tidak sesuai dengan constraint

**Solusi:**
```bash
# Cek foreign key constraints
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';
"
```

### 3. Error: Connection Refused

**Penyebab:**
- Database container tidak berjalan
- Environment variable DB_HOST salah

**Solusi:**
```bash
# Cek status container
docker compose ps stock-payment-db

# Cek environment variables
docker compose exec stock-payment-service env | grep DB_

# Restart service
docker compose restart stock-payment-service
```

## Verifikasi Database

### Cek Tabel yang Ada
```bash
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt"
```

**Expected Output:**
```
               List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | audit_logs         | table | postgres
 public | fact_transactions  | table | postgres
 public | integration_status | table | postgres
 public | schema_migrations  | table | postgres
```

### Cek Struktur Tabel
```bash
# Cek struktur fact_transactions
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d fact_transactions"

# Cek struktur audit_logs
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d audit_logs"

# Cek struktur integration_status
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d integration_status"
```

### Cek Indexes
```bash
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
"
```

## Re-run Migration

Jika ada masalah dengan migration, bisa re-run:

```bash
# Hapus semua tabel (HATI-HATI: Data akan hilang!)
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "
DROP TABLE IF EXISTS integration_status CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS fact_transactions CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
"

# Jalankan migration lagi
docker compose exec stock-payment-service node db/migrate.js
```

## Test Database Connection

```bash
# Test dari service
docker compose exec stock-payment-service node -e "
const db = require('./src/config/database');
db.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('Connected:', res.rows[0]);
  process.exit(0);
});
"
```

## Test GraphQL Query

```bash
# Test GraphQL query untuk transactions
curl -X POST http://localhost:3004/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ transactions { id transaction_id total_cost payment_status } }"}'
```

## Common Issues

### Issue 1: Migration sudah dijalankan tapi tabel tidak ada

**Kemungkinan:**
- Migration gagal tanpa error yang jelas
- Database connection issue saat migration

**Solusi:**
1. Cek log migration:
   ```bash
   docker compose exec stock-payment-service node db/migrate.js
   ```

2. Cek apakah ada error di log:
   ```bash
   docker compose logs stock-payment-service | grep -i error
   ```

3. Re-run migration dengan verbose output

### Issue 2: Foreign Key Constraint Error

**Error:**
```
ERROR: insert or update on table "audit_logs" violates foreign key constraint "fk_transaction"
```

**Penyebab:**
- Mencoba insert ke `audit_logs` atau `integration_status` dengan `transaction_id` yang tidak ada di `fact_transactions`

**Solusi:**
- Pastikan `transaction_id` sudah ada di `fact_transactions` sebelum insert ke tabel terkait
- Atau gunakan `transaction_id = NULL` jika tidak ada reference

### Issue 3: JSONB Column Error

**Error:**
```
ERROR: invalid input syntax for type jsonb
```

**Penyebab:**
- Data yang di-insert ke kolom JSONB tidak valid JSON

**Solusi:**
- Pastikan data di-stringify dengan benar:
  ```javascript
  JSON.stringify(data)
  ```

## Script Verifikasi

Gunakan script verifikasi yang sudah dibuat:

```bash
bash scripts/verify-stock-payment-db.sh
```

Script ini akan:
- ✅ Cek semua tabel
- ✅ Cek struktur tabel
- ✅ Cek foreign key constraints
- ✅ Cek indexes

## Reset Database (Development Only)

**⚠️ WARNING: Ini akan menghapus semua data!**

```bash
# Stop service
docker compose stop stock-payment-service

# Drop dan recreate database
docker compose exec stock-payment-db psql -U postgres -c "DROP DATABASE IF EXISTS stock_payment_db;"
docker compose exec stock-payment-db psql -U postgres -c "CREATE DATABASE stock_payment_db;"

# Start service
docker compose start stock-payment-service

# Run migration
docker compose exec stock-payment-service node db/migrate.js
```

## Support

Jika masalah masih terjadi:
1. Cek log service: `docker compose logs stock-payment-service`
2. Cek log database: `docker compose logs stock-payment-db`
3. Verifikasi environment variables
4. Pastikan semua containers berjalan: `docker compose ps`

