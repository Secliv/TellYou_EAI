#!/bin/bash

# Script untuk menjalankan migration stock-payment-service

echo "🔍 Checking stock-payment-service container..."
cd "$(dirname "$0")/.."

# Check if container is running
if ! docker compose ps | grep -q "stock-payment-service.*Up"; then
    echo "⚠️  stock-payment-service container is not running"
    echo "📦 Starting containers..."
    docker compose up -d stock-payment-service stock-payment-db
    echo "⏳ Waiting for services to be ready..."
    sleep 5
fi

echo ""
echo "🔄 Running migration for stock-payment-service..."
echo ""

# Run migration
docker compose exec stock-payment-service node db/migrate.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt" 2>&1 | grep -E "fact_transactions|audit_logs|integration_status" || echo "⚠️  Tables not found or error occurred"
else
    echo ""
    echo "❌ Migration failed!"
    echo "💡 Try running manually: docker compose exec stock-payment-service node db/migrate.js"
fi

