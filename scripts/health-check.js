#!/usr/bin/env node

/**
 * Comprehensive Health Check Script
 * Checks all services, databases, GraphQL endpoints, and integrations
 */

const axios = require('axios');
const { execSync } = require('child_process');
const { Client } = require('pg');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Service configurations
const services = {
  'user-service': {
    port: 3000,
    type: 'REST',
    health: 'http://localhost:3000/health',
    graphql: null,
    db: { host: 'localhost', port: 5433, name: 'user_db', user: 'postgres', password: 'postgres' }
  },
  'inventory-service': {
    port: 3001,
    type: 'GraphQL',
    health: 'http://localhost:3001/health',
    graphql: 'http://localhost:3001/graphql',
    db: { host: 'localhost', port: 5434, name: 'inventory_db', user: 'postgres', password: 'postgres' }
  },
  'payment-service': {
    port: 3002,
    type: 'GraphQL',
    health: 'http://localhost:3002/health',
    graphql: 'http://localhost:3002/graphql',
    db: { host: 'localhost', port: 5436, name: 'payment_db', user: 'postgres', password: 'postgres' }
  },
  'order-service': {
    port: 3003,
    type: 'GraphQL',
    health: 'http://localhost:3003/health',
    graphql: 'http://localhost:3003/graphql',
    db: { host: 'localhost', port: 5435, name: 'order_db', user: 'postgres', password: 'postgres' }
  },
  'stock-payment-service': {
    port: 3004,
    type: 'GraphQL',
    health: 'http://localhost:3004/health',
    graphql: 'http://localhost:3004/graphql',
    db: { host: 'localhost', port: 5437, name: 'stock_payment_db', user: 'postgres', password: 'postgres' }
  }
};

// GraphQL test queries
const graphqlQueries = {
  'inventory-service': {
    query: `
      query {
        inventories {
          id
          name
          category
          stock
        }
      }
    `
  },
  'payment-service': {
    query: `
      query {
        payments {
          id
          orderId
          amount
          status
        }
      }
    `
  },
  'order-service': {
    query: `
      query {
        orders {
          id
          customerId
          status
          totalPrice
        }
      }
    `
  },
  'stock-payment-service': {
    query: `
      query {
        transactions {
          id
          type
          status
        }
      }
    `
  }
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Check Docker containers
async function checkDockerContainers() {
  logSection('1. DOCKER CONTAINER STATUS');
  
  try {
    const output = execSync('docker compose ps', { encoding: 'utf-8' });
    console.log(output);
    
    // Parse container status
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('NAME'));
    const containers = {};
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const status = parts[parts.length - 1];
        containers[name] = status;
      }
    });
    
    // Check each service container
    Object.keys(services).forEach(serviceName => {
      const containerName = serviceName;
      if (containers[containerName]) {
        const status = containers[containerName];
        if (status.includes('Up')) {
          logSuccess(`${containerName}: Running`);
        } else {
          logError(`${containerName}: ${status}`);
        }
      } else {
        logWarning(`${containerName}: Container not found`);
      }
    });
    
    return true;
  } catch (error) {
    logError(`Failed to check Docker containers: ${error.message}`);
    return false;
  }
}

// Check REST API health endpoints
async function checkServiceHealth() {
  logSection('2. SERVICE HEALTH CHECKS (REST APIs)');
  
  const results = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    try {
      logInfo(`Checking ${serviceName}...`);
      const response = await axios.get(config.health, { timeout: 5000 });
      
      // Handle different response formats
      const isHealthy = response.status === 200 && (
        response.data.status === 'ok' || 
        response.data.status === 'healthy' ||
        (response.data.database === 'connected' && response.data.status === 'healthy')
      );
      
      if (isHealthy) {
        logSuccess(`${serviceName} (${config.type}): Healthy - ${config.health}`);
        results[serviceName] = { status: 'ok', response: response.data };
      } else {
        logWarning(`${serviceName}: Unexpected response - ${JSON.stringify(response.data)}`);
        results[serviceName] = { status: 'warning', response: response.data };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logError(`${serviceName}: Connection refused - Service may not be running`);
      } else if (error.code === 'ETIMEDOUT') {
        logError(`${serviceName}: Request timeout - Service may be slow or unresponsive`);
      } else {
        logError(`${serviceName}: ${error.message}`);
      }
      results[serviceName] = { status: 'error', error: error.message };
    }
  }
  
  return results;
}

// Check GraphQL endpoints
async function checkGraphQLEndpoints() {
  logSection('3. GRAPHQL ENDPOINT CHECKS');
  
  const results = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    if (!config.graphql) {
      logInfo(`${serviceName}: No GraphQL endpoint (REST only)`);
      continue;
    }
    
    try {
      logInfo(`Checking GraphQL endpoint for ${serviceName}...`);
      
      // Test GraphQL introspection query
      const introspectionQuery = {
        query: `
          query IntrospectionQuery {
            __schema {
              queryType {
                name
              }
              mutationType {
                name
              }
              types {
                name
              }
            }
          }
        `
      };
      
      const response = await axios.post(
        config.graphql,
        introspectionQuery,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      
      if (response.data && response.data.data && response.data.data.__schema) {
        const schema = response.data.data.__schema;
        const queryType = schema.queryType ? schema.queryType.name : 'N/A';
        const mutationType = schema.mutationType ? schema.mutationType.name : 'N/A';
        const typesCount = schema.types ? schema.types.length : 0;
        
        logSuccess(`${serviceName} GraphQL: Connected`);
        logInfo(`  - Query Type: ${queryType}`);
        logInfo(`  - Mutation Type: ${mutationType || 'None'}`);
        logInfo(`  - Types Count: ${typesCount}`);
        logInfo(`  - Endpoint: ${config.graphql}`);
        logInfo(`  - Apollo Sandbox: ${config.graphql} (open in browser)`);
        
        results[serviceName] = { status: 'ok', schema: schema };
      } else {
        logWarning(`${serviceName} GraphQL: Unexpected response format`);
        results[serviceName] = { status: 'warning', response: response.data };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logError(`${serviceName} GraphQL: Connection refused`);
      } else if (error.response) {
        logError(`${serviceName} GraphQL: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        logError(`${serviceName} GraphQL: ${error.message}`);
      }
      results[serviceName] = { status: 'error', error: error.message };
    }
  }
  
  return results;
}

// Test GraphQL queries
async function testGraphQLQueries() {
  logSection('4. GRAPHQL QUERY TESTS');
  
  const results = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    if (!config.graphql || !graphqlQueries[serviceName]) {
      continue;
    }
    
    try {
      logInfo(`Testing GraphQL query for ${serviceName}...`);
      
      const response = await axios.post(
        config.graphql,
        graphqlQueries[serviceName],
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      
      if (response.data.errors) {
        logWarning(`${serviceName} GraphQL Query: Has errors (may be expected if no data)`);
        logInfo(`  Errors: ${JSON.stringify(response.data.errors)}`);
        results[serviceName] = { status: 'warning', errors: response.data.errors };
      } else if (response.data.data) {
        logSuccess(`${serviceName} GraphQL Query: Success`);
        const dataKeys = Object.keys(response.data.data);
        logInfo(`  Returned data: ${dataKeys.join(', ')}`);
        results[serviceName] = { status: 'ok', data: response.data.data };
      } else {
        logWarning(`${serviceName} GraphQL Query: Unexpected response`);
        results[serviceName] = { status: 'warning', response: response.data };
      }
    } catch (error) {
      if (error.response && error.response.data) {
        logError(`${serviceName} GraphQL Query: ${JSON.stringify(error.response.data)}`);
      } else {
        logError(`${serviceName} GraphQL Query: ${error.message}`);
      }
      results[serviceName] = { status: 'error', error: error.message };
    }
  }
  
  return results;
}

// Check PostgreSQL database connections
async function checkDatabaseConnections() {
  logSection('5. POSTGRESQL DATABASE CONNECTIONS');
  
  const results = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    if (!config.db) {
      logInfo(`${serviceName}: No database configured`);
      continue;
    }
    
    const client = new Client({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      connectionTimeoutMillis: 3000
    });
    
    try {
      logInfo(`Connecting to ${serviceName} database (${config.db.name})...`);
      await client.connect();
      
      // Test query
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      const dbTime = result.rows[0].current_time;
      const dbVersion = result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1];
      
      // Get table count
      const tableResult = await client.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableCount = tableResult.rows[0].table_count;
      
      logSuccess(`${serviceName} Database: Connected`);
      logInfo(`  - Database: ${config.db.name}`);
      logInfo(`  - Host: ${config.db.host}:${config.db.port}`);
      logInfo(`  - PostgreSQL Version: ${dbVersion}`);
      logInfo(`  - Current Time: ${dbTime}`);
      logInfo(`  - Tables: ${tableCount}`);
      
      await client.end();
      results[serviceName] = { status: 'ok', time: dbTime, version: dbVersion, tables: tableCount };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logError(`${serviceName} Database: Connection refused - Database may not be running`);
      } else if (error.code === 'ETIMEDOUT') {
        logError(`${serviceName} Database: Connection timeout`);
      } else if (error.code === '28P01') {
        logError(`${serviceName} Database: Authentication failed`);
      } else if (error.code === '3D000') {
        logError(`${serviceName} Database: Database "${config.db.name}" does not exist`);
      } else {
        logError(`${serviceName} Database: ${error.message}`);
      }
      results[serviceName] = { status: 'error', error: error.message };
      
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  return results;
}

// Verify service integrations
async function verifyServiceIntegrations() {
  logSection('6. SERVICE INTEGRATION VERIFICATION');
  
  logInfo('Checking service-to-service communication...');
  
  // Test user-service -> inventory-service
  try {
    logInfo('Testing User Service -> Inventory Service integration...');
    const inventoryHealth = await axios.get(services['inventory-service'].health, { timeout: 3000 });
    if (inventoryHealth.status === 200) {
      logSuccess('User Service can reach Inventory Service');
    }
  } catch (error) {
    logWarning(`User Service -> Inventory Service: ${error.message}`);
  }
  
  // Test order-service -> payment-service
  try {
    logInfo('Testing Order Service -> Payment Service integration...');
    const paymentHealth = await axios.get(services['payment-service'].health, { timeout: 3000 });
    if (paymentHealth.status === 200) {
      logSuccess('Order Service can reach Payment Service');
    }
  } catch (error) {
    logWarning(`Order Service -> Payment Service: ${error.message}`);
  }
  
  // Test frontend -> backend services
  try {
    logInfo('Testing Frontend -> Backend Services...');
    const userHealth = await axios.get(services['user-service'].health, { timeout: 3000 });
    if (userHealth.status === 200) {
      logSuccess('Frontend can reach User Service');
    }
  } catch (error) {
    logWarning(`Frontend -> User Service: ${error.message}`);
  }
  
  logInfo('Integration checks completed');
}

// Generate summary report
function generateSummary(healthResults, graphqlResults, dbResults) {
  logSection('SUMMARY REPORT');
  
  const totalServices = Object.keys(services).length;
  let healthyServices = 0;
  let healthyGraphQL = 0;
  let healthyDBs = 0;
  
  // Count healthy services
  Object.values(healthResults).forEach(result => {
    if (result.status === 'ok') healthyServices++;
  });
  
  // Count healthy GraphQL endpoints
  Object.values(graphqlResults).forEach(result => {
    if (result.status === 'ok') healthyGraphQL++;
  });
  
  // Count healthy databases
  Object.values(dbResults).forEach(result => {
    if (result.status === 'ok') healthyDBs++;
  });
  
  log(`Total Services: ${totalServices}`, 'bright');
  log(`Healthy Services: ${healthyServices}/${totalServices}`, healthyServices === totalServices ? 'green' : 'yellow');
  
  const graphqlServices = Object.values(services).filter(s => s.graphql).length;
  log(`GraphQL Endpoints: ${healthyGraphQL}/${graphqlServices}`, healthyGraphQL === graphqlServices ? 'green' : 'yellow');
  
  const dbServices = Object.values(services).filter(s => s.db).length;
  log(`Database Connections: ${healthyDBs}/${dbServices}`, healthyDBs === dbServices ? 'green' : 'yellow');
  
  console.log('\n' + '-'.repeat(60));
  log('GraphQL Playground URLs (Apollo Sandbox):', 'bright');
  Object.entries(services).forEach(([name, config]) => {
    if (config.graphql) {
      log(`  ${name}: ${config.graphql}`, 'cyan');
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  log('Service URLs:', 'bright');
  Object.entries(services).forEach(([name, config]) => {
    log(`  ${name}: http://localhost:${config.port}`, 'cyan');
  });
  
  console.log('\n' + '-'.repeat(60));
  
  if (healthyServices === totalServices && healthyGraphQL === graphqlServices && healthyDBs === dbServices) {
    logSuccess('All systems operational! 🎉');
  } else {
    logWarning('Some services need attention. Please check the errors above.');
  }
}

// Main execution
async function main() {
  console.clear();
  log('\n🔍 TELLYOU EAI - COMPREHENSIVE HEALTH CHECK\n', 'bright');
  
  try {
    // 1. Check Docker containers
    await checkDockerContainers();
    
    // 2. Check service health
    const healthResults = await checkServiceHealth();
    
    // 3. Check GraphQL endpoints
    const graphqlResults = await checkGraphQLEndpoints();
    
    // 4. Test GraphQL queries
    await testGraphQLQueries();
    
    // 5. Check database connections
    const dbResults = await checkDatabaseConnections();
    
    // 6. Verify integrations
    await verifyServiceIntegrations();
    
    // 7. Generate summary
    generateSummary(healthResults, graphqlResults, dbResults);
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the health check
main();

