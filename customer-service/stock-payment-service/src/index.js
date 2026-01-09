require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolver");
const transactionRoutes = require("./routes/TransactionRoutes");
const db = require("./config/database");
const { getUserFromRequest } = require("./utils/jwtHelper");

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'https://studio.apollographql.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const dbResult = await db.query('SELECT NOW()');

    res.status(200).json({
      status: 'healthy',
      service: process.env.SERVICE_NAME || 'stock-payment-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: process.env.SERVICE_NAME || 'stock-payment-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Info Endpoint
app.get('/', (req, res) => {
  res.json({
    service: process.env.SERVICE_NAME || 'stock-payment-service',
    version: '1.0.0',
    description: 'Integration Facade & Fact Service for Order-Payment-Inventory Orchestration',
    endpoints: {
      health: '/health',
      api: '/api',
      graphql: '/graphql'
    }
  });
});

// REST API Routes
app.use("/api", transactionRoutes);

// Initialize Apollo Server
async function startApolloServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    csrfPrevention: false, // Disable CSRF for development (Apollo Sandbox needs GET requests)
    plugins: [
      // Enable Apollo Sandbox landing page
      ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ],
  });

  await apolloServer.start();

  // Apply GraphQL middleware
  app.use('/graphql',
    express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          // Get user from JWT token
          const user = getUserFromRequest(req);
          const authHeader = req.headers.authorization || '';
          
          // Debug logging - always log in development
          console.log('📋 GraphQL Context:', {
            hasAuthHeader: !!authHeader,
            authHeaderLength: authHeader ? authHeader.length : 0,
            authHeaderValue: authHeader ? (authHeader.substring(0, 20) + '...') : 'none',
            hasUser: !!user,
            userIsNull: user === null,
            userIsUndefined: user === undefined,
            userRole: user?.role,
            path: req.path,
            method: req.method
          });
          
          // Pass both user and authHeader to resolvers and services
          // IMPORTANT: user will be null if no valid token is provided
          return { user, authHeader, req };
        }
      })
  );

  // 404 Handler (must be after all routes including GraphQL)
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      availableEndpoints: ['/', '/health', '/api', '/graphql']
    });
  });

  // Error Handler
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  console.log(`✅ Apollo Server started - GraphQL endpoint: http://localhost:${PORT}/graphql`);
}

// Start listening after Apollo Server initialization
async function startServer() {
  await testDatabaseConnection();
  await startApolloServer();

  // Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 ${process.env.SERVICE_NAME || 'Stock-Payment-Service'} Started`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`📡 Server:      http://localhost:${PORT}`);
    console.log(`🏥 Health:      http://localhost:${PORT}/health`);
    console.log(`📊 GraphQL:     http://localhost:${PORT}/graphql`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════════════');
  });
}

// Database connection test on startup
async function testDatabaseConnection() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️  Service will start but database operations will fail');
    return false;
  }
}

// Start server
startServer().catch(console.error);

module.exports = app;