#!/bin/bash

# Script untuk menjalankan migrations dari dalam Docker containers
# Usage: bash scripts/migrate-docker.sh [service-name]

echo "🚀 Running database migrations in Docker containers..."
echo ""

SERVICES=("user-service" "inventory-service" "payment-service" "order-service" "stock-payment-service")

if [ -n "$1" ]; then
  # Run migration for specific service
  SERVICE=$1
  echo "🔄 Running migration for $SERVICE..."
  docker compose exec $SERVICE node db/migrate.js
  if [ $? -eq 0 ]; then
    echo "✅ $SERVICE: Migration completed successfully"
  else
    echo "❌ $SERVICE: Migration failed"
    exit 1
  fi
else
  # Run migrations for all services
  SUCCESS_COUNT=0
  FAILED_COUNT=0
  
  for SERVICE in "${SERVICES[@]}"; do
    echo "🔄 Running migration for $SERVICE..."
    if docker compose exec $SERVICE node db/migrate.js 2>&1; then
      echo "✅ $SERVICE: Migration completed successfully"
      ((SUCCESS_COUNT++))
    else
      echo "❌ $SERVICE: Migration failed (or no migration script)"
      ((FAILED_COUNT++))
    fi
    echo ""
  done
  
  echo "📊 Summary:"
  echo "  ✅ Successful: $SUCCESS_COUNT"
  echo "  ❌ Failed: $FAILED_COUNT"
fi


