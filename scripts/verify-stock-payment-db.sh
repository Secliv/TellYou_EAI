#!/bin/bash

# Script untuk verifikasi dan memperbaiki database stock-payment-service

echo "🔍 Verifying Stock-Payment Service Database..."
echo ""

# Check if tables exist
echo "📊 Checking tables..."
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt" 2>&1

echo ""
echo "🔍 Checking table structures..."
echo ""

# Check fact_transactions table
echo "=== fact_transactions ==="
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d fact_transactions" 2>&1 | head -30

echo ""
echo "=== audit_logs ==="
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d audit_logs" 2>&1 | head -20

echo ""
echo "=== integration_status ==="
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\d integration_status" 2>&1 | head -20

echo ""
echo "🔍 Checking foreign key constraints..."
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
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';
" 2>&1

echo ""
echo "✅ Verification complete!"

