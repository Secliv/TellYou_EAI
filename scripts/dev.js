#!/usr/bin/env node

/**
 * Script untuk menjalankan development mode untuk service tertentu
 * Usage: node scripts/dev.js [service-name]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const services = [
  {
    name: 'user-service',
    path: 'provider-service/user-service',
  },
  {
    name: 'inventory-service',
    path: 'provider-service/inventory-service',
  },
  {
    name: 'payment-service',
    path: 'provider-service/payment-service',
  },
  {
    name: 'order-service',
    path: 'customer-service/order-service',
  },
  {
    name: 'stock-payment-service',
    path: 'customer-service/stock-payment-service',
  },
];

function runDev(service) {
  const servicePath = path.join(__dirname, '..', service.path);
  const packageJsonPath = path.join(servicePath, 'package.json');

  // Check if service directory exists
  if (!fs.existsSync(servicePath)) {
    console.error(`❌ ${service.name}: Directory not found`);
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ ${service.name}: package.json not found`);
    process.exit(1);
  }

  // Check if node_modules exists, if not, install dependencies
  const nodeModulesPath = path.join(servicePath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`📦 Installing dependencies for ${service.name}...`);
    const installProcess = spawn('npm', ['install'], {
      cwd: servicePath,
      stdio: 'inherit',
      shell: true,
    });

    installProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Failed to install dependencies`);
        process.exit(1);
      }
      startDev(servicePath);
    });
  } else {
    startDev(servicePath);
  }
}

function startDev(servicePath) {
  console.log(`🚀 Starting development server...\n`);
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true,
  });

  devProcess.on('close', (code) => {
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    devProcess.kill('SIGINT');
  });
}

// Get service name from command line argument
const serviceName = process.argv[2];

if (!serviceName) {
  console.error('❌ Service name is required');
  console.log('\nUsage: npm run dev [service-name]');
  console.log('\nAvailable services:');
  services.forEach(s => {
    console.log(`  - ${s.name}`);
  });
  console.log('\nExample: npm run dev user-service');
  process.exit(1);
}

const service = services.find(s => s.name === serviceName);

if (!service) {
  console.error(`❌ Service "${serviceName}" not found`);
  console.log('\nAvailable services:');
  services.forEach(s => {
    console.log(`  - ${s.name}`);
  });
  process.exit(1);
}

runDev(service);

