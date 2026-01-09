#!/usr/bin/env node

/**
 * Script untuk menjalankan migrations untuk semua services
 * Usage: node scripts/migrate-all.js [service-name]
 *        node scripts/migrate-all.js (runs all)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const services = [
  {
    name: 'user-service',
    path: 'provider-service/user-service',
    hasMigration: true,
  },
  {
    name: 'inventory-service',
    path: 'provider-service/inventory-service',
    hasMigration: true,
  },
  {
    name: 'payment-service',
    path: 'provider-service/payment-service',
    hasMigration: true,
  },
  {
    name: 'order-service',
    path: 'customer-service/order-service',
    hasMigration: true,
  },
  {
    name: 'stock-payment-service',
    path: 'customer-service/stock-payment-service',
    hasMigration: false,
  },
];

function checkDependencies(servicePath) {
  const nodeModulesPath = path.join(servicePath, 'node_modules');
  return fs.existsSync(nodeModulesPath);
}

function installDependencies(servicePath) {
  try {
    console.log(`📦 Installing dependencies...`);
    execSync('npm install', { 
      cwd: servicePath, 
      stdio: 'inherit' 
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to install dependencies`);
    return false;
  }
}

function runMigration(service) {
  const servicePath = path.join(__dirname, '..', service.path);
  const packageJsonPath = path.join(servicePath, 'package.json');
  const migrateScriptPath = path.join(servicePath, 'db', 'migrate.js');

  // Check if service directory exists
  if (!fs.existsSync(servicePath)) {
    console.log(`⚠️  ${service.name}: Directory not found, skipping...`);
    return false;
  }

  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  ${service.name}: package.json not found, skipping...`);
    return false;
  }

  // Check if migrate script exists
  if (!fs.existsSync(migrateScriptPath)) {
    console.log(`⚠️  ${service.name}: Migration script not found, skipping...`);
    return false;
  }

  // Check and install dependencies if needed
  if (!checkDependencies(servicePath)) {
    console.log(`📦 ${service.name}: Dependencies not installed, installing...`);
    if (!installDependencies(servicePath)) {
      console.error(`❌ ${service.name}: Failed to install dependencies, skipping migration...`);
      return false;
    }
  }

  try {
    console.log(`\n🔄 Running migrations for ${service.name}...`);
    process.chdir(servicePath);
    execSync('node db/migrate.js', { stdio: 'inherit' });
    console.log(`✅ ${service.name}: Migrations completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${service.name}: Migration failed\n`);
    return false;
  }
}

// Get service name from command line argument
const serviceName = process.argv[2];
const rootDir = path.join(__dirname, '..');
process.chdir(rootDir);

if (serviceName) {
  // Run migration for specific service
  const service = services.find(s => s.name === serviceName);
  if (service) {
    if (service.hasMigration) {
      runMigration(service);
    } else {
      console.log(`⚠️  ${serviceName} doesn't have migrations yet.`);
    }
  } else {
    console.error(`❌ Service "${serviceName}" not found.`);
    console.log('\nAvailable services:');
    services.forEach(s => {
      console.log(`  - ${s.name}${s.hasMigration ? ' (has migrations)' : ''}`);
    });
    process.exit(1);
  }
} else {
  // Run migrations for all services that have them
  console.log('🚀 Running migrations for all services...\n');
  const servicesWithMigrations = services.filter(s => s.hasMigration);
  
  if (servicesWithMigrations.length === 0) {
    console.log('⚠️  No services with migrations found.');
    process.exit(0);
  }

  let successCount = 0;
  servicesWithMigrations.forEach(service => {
    if (runMigration(service)) {
      successCount++;
    }
    process.chdir(rootDir); // Return to root after each migration
  });

  console.log(`\n📊 Summary: ${successCount}/${servicesWithMigrations.length} services migrated successfully`);
  
  if (successCount < servicesWithMigrations.length) {
    process.exit(1);
  }
}

