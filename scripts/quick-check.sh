#!/bin/bash

# Quick Health Check Script
# Simple bash script for quick service status checks

echo "🔍 TELLYOU EAI - Quick Health Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Docker containers
echo "1. Docker Container Status:"
echo "----------------------------"
docker compose ps
echo ""

# Check service health endpoints
echo "2. Service Health Checks:"
echo "-------------------------"

services=(
  "user-service:3000"
  "inventory-service:3001"
  "payment-service:3002"
  "order-service:3003"
  "stock-payment-service:3004"
)

for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $name${NC} (http://localhost:$port)"
  else
    echo -e "${RED}❌ $name${NC} (http://localhost:$port) - Not responding"
  fi
done

echo ""
echo "3. GraphQL Endpoints:"
echo "---------------------"
echo -e "${CYAN}Inventory Service:${NC} http://localhost:3001/graphql"
echo -e "${CYAN}Payment Service:${NC}   http://localhost:3002/graphql"
echo -e "${CYAN}Order Service:${NC}     http://localhost:3003/graphql"
echo -e "${CYAN}Stock-Payment Service:${NC} http://localhost:3004/graphql"
echo ""

echo "4. Database Ports:"
echo "------------------"
echo -e "${CYAN}User DB:${NC}         localhost:5433"
echo -e "${CYAN}Inventory DB:${NC}    localhost:5434"
echo -e "${CYAN}Payment DB:${NC}       localhost:5436"
echo -e "${CYAN}Order DB:${NC}         localhost:5435"
echo -e "${YELLOW}Stock-Payment DB:${NC}  (internal only - no port mapping)"
echo ""

echo "For comprehensive check, run: npm run health-check"

