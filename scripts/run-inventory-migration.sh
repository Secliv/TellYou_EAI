#!/bin/bash

# Script untuk menjalankan migration inventory-service

echo "🔍 Checking inventory-service container..."
cd "$(dirname "$0")/.."

# Check if container is running
if ! docker compose ps | grep -q "inventory-service.*Up"; then
    echo "⚠️  inventory-service container is not running"
    echo "📦 Starting containers..."
    docker compose up -d inventory-service inventory-db
    echo "⏳ Waiting for services to be ready..."
    sleep 5
fi

echo ""
echo "🔄 Running migration for inventory-service..."
echo ""

# Run migration
docker compose exec inventory-service node db/migrate.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    docker compose exec inventory-db psql -U postgres -d inventory_db -c "\dt" 2>&1 | grep -E "inventory|migrations" || echo "⚠️  Tables not found or error occurred"
else
    echo ""
    echo "❌ Migration failed!"
    echo "💡 Try running manually: docker compose exec inventory-service node db/migrate.js"
fi

