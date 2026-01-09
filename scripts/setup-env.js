#!/usr/bin/env node

/**
 * Script untuk setup environment variables untuk semua services
 * Usage: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const services = [
  {
    name: 'user-service',
    path: 'provider-service/user-service',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'user_db',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_EXPIRES_IN: '24h',
    },
  },
  {
    name: 'inventory-service',
    path: 'provider-service/inventory-service',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'inventory_db',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
    },
  },
  {
    name: 'payment-service',
    path: 'provider-service/payment-service',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'payment_db',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
    },
  },
  {
    name: 'order-service',
    path: 'customer-service/order-service',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'order_db',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
    },
  },
  {
    name: 'stock-payment-service',
    path: 'customer-service/stock-payment-service',
    env: {
      PORT: '3000',
      NODE_ENV: 'development',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'stock_payment_db',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
    },
  },
];

function createEnvFile(service) {
  const envPath = path.join(__dirname, '..', service.path, '.env');
  const envDir = path.dirname(envPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Generate env file content
  let content = `# ${service.name.toUpperCase()} Environment Variables\n`;
  content += `# Generated automatically - Edit as needed\n\n`;

  if (service.name === 'user-service') {
    content += `# Server Configuration\n`;
    content += `PORT=${service.env.PORT}\n`;
    content += `NODE_ENV=${service.env.NODE_ENV}\n\n`;
    content += `# Database Configuration\n`;
    content += `DB_HOST=${service.env.DB_HOST}\n`;
    content += `DB_PORT=${service.env.DB_PORT}\n`;
    content += `DB_NAME=${service.env.DB_NAME}\n`;
    content += `DB_USER=${service.env.DB_USER}\n`;
    content += `DB_PASSWORD=${service.env.DB_PASSWORD}\n\n`;
    content += `# JWT Configuration\n`;
    content += `JWT_SECRET=${service.env.JWT_SECRET}\n`;
    content += `JWT_EXPIRES_IN=${service.env.JWT_EXPIRES_IN}\n`;
  } else {
    content += `# Server Configuration\n`;
    content += `PORT=${service.env.PORT}\n`;
    content += `NODE_ENV=${service.env.NODE_ENV}\n\n`;
    content += `# Database Configuration\n`;
    content += `DB_HOST=${service.env.DB_HOST}\n`;
    content += `DB_PORT=${service.env.DB_PORT}\n`;
    content += `DB_NAME=${service.env.DB_NAME}\n`;
    content += `DB_USER=${service.env.DB_USER}\n`;
    content += `DB_PASSWORD=${service.env.DB_PASSWORD}\n`;
  }

  // Write file
  fs.writeFileSync(envPath, content);
  console.log(`✓ Created ${service.path}/.env`);
}

console.log('Setting up environment variables for all services...\n');

services.forEach(service => {
  try {
    createEnvFile(service);
  } catch (error) {
    console.error(`✗ Error creating .env for ${service.name}:`, error.message);
  }
});

console.log('\n✅ All environment files created successfully!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Review and edit the .env files if needed');
console.log('   - For Docker, DB_HOST should be <service-name>-db (e.g., user-db)');
console.log('   - JWT_SECRET has been auto-generated for user-service');
console.log('   - Change passwords for production use');

