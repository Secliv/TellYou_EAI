#!/bin/bash

# Script untuk menjalankan semua database migration di Tellyou---EAI-main

echo "🚀 Starting All Database Migrations for Tellyou---EAI-main"
echo "============================================================"
echo ""

cd "$(dirname "$0")/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run migration for a service
run_migration() {
    local service_name=$1
    local container_name=$2
    
    echo ""
    echo "${YELLOW}📦 Running migration for ${service_name}...${NC}"
    
    # Check if container is running
    if ! docker compose ps | grep -q "${container_name}.*Up"; then
        echo "${YELLOW}⚠️  ${container_name} is not running, starting it...${NC}"
        docker compose up -d ${container_name} 2>/dev/null || true
        echo "⏳ Waiting for ${container_name} to be ready..."
        sleep 3
    fi
    
    # Run migration
    if docker compose exec ${container_name} node db/migrate.js 2>&1; then
        echo "${GREEN}✅ ${service_name} migration completed successfully!${NC}"
        return 0
    else
        echo "${RED}❌ ${service_name} migration failed!${NC}"
        echo "💡 Make sure ${container_name} container is running and has db/migrate.js file"
        return 1
    fi
}

# Start all databases first
echo "🔧 Starting all database containers..."
docker compose up -d user-db inventory-db payment-db order-db stock-payment-db 2>/dev/null || true
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Track results
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_SERVICES=()

# 1. User Service
if run_migration "User Service" "user-service"; then
    ((SUCCESS_COUNT++))
else
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("user-service")
fi

# 2. Inventory Service
if run_migration "Inventory Service" "inventory-service"; then
    ((SUCCESS_COUNT++))
else
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("inventory-service")
fi

# 3. Payment Service
if run_migration "Payment Service" "payment-service"; then
    ((SUCCESS_COUNT++))
else
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("payment-service")
fi

# 4. Order Service
if run_migration "Order Service" "order-service"; then
    ((SUCCESS_COUNT++))
else
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("order-service")
fi

# 5. Stock-Payment Service
if run_migration "Stock-Payment Service" "stock-payment-service"; then
    ((SUCCESS_COUNT++))
else
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("stock-payment-service")
fi

# Summary
echo ""
echo "============================================================"
echo "📊 Migration Summary"
echo "============================================================"
echo "${GREEN}✅ Successful: ${SUCCESS_COUNT}${NC}"
if [ ${FAILED_COUNT} -gt 0 ]; then
    echo "${RED}❌ Failed: ${FAILED_COUNT}${NC}"
    echo ""
    echo "Failed services:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "  - ${service}"
    done
    echo ""
    echo "💡 Try running migration manually for failed services:"
    echo "   docker compose exec <service-name> node db/migrate.js"
else
    echo "${GREEN}🎉 All migrations completed successfully!${NC}"
fi
echo ""

# Verify tables
echo "🔍 Verifying database tables..."
echo ""
echo "User DB:"
docker compose exec user-db psql -U postgres -d user_db -c "\dt" 2>&1 | grep -E "users|user_profiles|migrations" || echo "  No tables found"
echo ""
echo "Inventory DB:"
docker compose exec inventory-db psql -U postgres -d inventory_db -c "\dt" 2>&1 | grep -E "inventory|migrations" || echo "  No tables found"
echo ""
echo "Payment DB:"
docker compose exec payment-db psql -U postgres -d payment_db -c "\dt" 2>&1 | grep -E "payments|migrations" || echo "  No tables found"
echo ""
echo "Order DB:"
docker compose exec order-db psql -U postgres -d order_db -c "\dt" 2>&1 | grep -E "orders|migrations" || echo "  No tables found"
echo ""
echo "Stock-Payment DB:"
docker compose exec stock-payment-db psql -U postgres -d stock_payment_db -c "\dt" 2>&1 | grep -E "fact_transactions|audit_logs|integration_status|migrations" || echo "  No tables found"

echo ""
echo "✅ Migration process completed!"

