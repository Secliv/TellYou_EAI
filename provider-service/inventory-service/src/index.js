require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

const pool = require('./config/database');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUserFromRequest } = require('./utils/jwtHelper');

const app = express();
// Use PORT from environment (docker-compose) or default to 3000
// Environment variables from docker-compose override .env file
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'https://studio.apollographql.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const startServer = async () => {
  try {
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    });

    await apolloServer.start();

    // Info and Health check
    app.get('/', (req, res) => {
      res.json({
        message: 'Inventory Management Service is running',
        graphql: '/graphql',
        health: '/health'
      });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'inventory-service' });
    });

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

    // REST endpoints for backward compatibility
    const Inventory = require('./models/Inventory');

    app.get('/inventories', async (req, res) => {
      try {
        const { category, search } = req.query;
        const filters = {};
        if (category) filters.category = category;
        if (search) filters.search = search;

        const items = await Inventory.findAll(filters);
        res.json({ success: true, data: items, total: items.length });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    app.post('/update-stock', async (req, res) => {
      try {
        const { id, quantityChange } = req.body;
        const item = await Inventory.updateStock(id, quantityChange);
        res.json({ success: true, data: item });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    });

    app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    // Test database connection
    pool.query('SELECT NOW()', (err, result) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Database connected successfully at:', result.rows[0].now);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Inventory Management Service running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
