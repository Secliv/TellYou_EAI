const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
require('dotenv').config();
const pool = require('./config/database');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Import GraphQL
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUserFromRequest } = require('./utils/jwtHelper');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'User Service is running',
    service: 'user-service',
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/users',
      graphql: '/graphql'
    }
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Error handling middleware (must be before 404 handler)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start Apollo Server
const startApolloServer = async () => {
  try {
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    });

    await apolloServer.start();

    // GraphQL endpoint - must be defined before 404 handler
    app.use('/graphql',
      express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          // Get user from JWT token
          const user = getUserFromRequest(req);
          return { user };
        }
      })
    );

    // 404 handler - must be last, after all routes including GraphQL
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
        method: req.method,
        availableEndpoints: ['/', '/health', '/auth', '/users', '/graphql']
      });
    });

    console.log(`✅ Apollo Server started - GraphQL endpoint: http://localhost:${PORT}/graphql`);
    return apolloServer;
  } catch (error) {
    console.error('Failed to start Apollo Server:', error);
    throw error; // Re-throw to prevent server from starting if GraphQL fails
  }
};

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Start server
const startServer = async () => {
  try {
    await startApolloServer();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════════════');
      console.log(`🚀 User Service Started`);
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 Server:      http://localhost:${PORT}`);
      console.log(`🏥 Health:      http://localhost:${PORT}/health`);
      console.log(`🔐 Auth:        http://localhost:${PORT}/auth`);
      console.log(`👥 Users:       http://localhost:${PORT}/users`);
      console.log(`📊 GraphQL:     http://localhost:${PORT}/graphql`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

