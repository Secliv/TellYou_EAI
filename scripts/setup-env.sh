#!/bin/bash

# Script untuk setup environment variables untuk semua services

echo "Setting up environment variables for all services..."

# User Service
cat > provider-service/user-service/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=user_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h
EOF
echo "✓ Created provider-service/user-service/.env"

# Inventory Service
cat > provider-service/inventory-service/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres
EOF
echo "✓ Created provider-service/inventory-service/.env"

# Payment Service
cat > provider-service/payment-service/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
EOF
echo "✓ Created provider-service/payment-service/.env"

# Order Service
cat > customer-service/order-service/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=order_db
DB_USER=postgres
DB_PASSWORD=postgres
EOF
echo "✓ Created customer-service/order-service/.env"

# Stock-Payment Service
cat > customer-service/stock-payment-service/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_payment_db
DB_USER=postgres
DB_PASSWORD=postgres
EOF
echo "✓ Created customer-service/stock-payment-service/.env"

echo ""
echo "✅ All environment files created successfully!"
echo ""
echo "⚠️  IMPORTANT: Edit the .env files and change:"
echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (if using local database)"
echo "   - JWT_SECRET in user-service (generate a secure secret)"
echo ""
echo "To generate a secure JWT secret, run:"
echo "  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""

