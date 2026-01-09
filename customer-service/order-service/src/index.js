const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
require('dotenv').config();

const pool = require('./config/database');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUserFromRequest } = require('./utils/jwtHelper');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'https://studio.apollographql.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {
  try {
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true })
      ],
    });

    await apolloServer.start();

    // Info and Health check
    app.get('/', (req, res) => {
      res.json({
        message: 'Order Management Service is running',
        graphql: '/graphql',
        health: '/health'
      });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'order-service' });
    });

    // Apply GraphQL middleware
    app.use('/graphql',
      express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          // Get user from JWT token
          const user = getUserFromRequest(req);
          const authHeader = req.headers.authorization || '';
          return { user, authHeader };
        }
      })
    );

    // REST endpoints for backward compatibility
    app.post('/order', async (req, res) => {
      try {
        const Order = require('./models/Order');
        const { customerId, customerName, items, notes, shippingAddress } = req.body;

        if (!items || items.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Order must contain at least one item'
          });
        }

        const totalPrice = items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);

        const order = await Order.create({
          customerId,
          customerName,
          items,
          totalPrice,
          notes,
          shippingAddress
        });

        res.status(201).json({
          success: true,
          message: 'Order created successfully',
          data: order
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    app.get('/order/:id', async (req, res) => {
      try {
        const Order = require('./models/Order');
        const order = await Order.findById(req.params.id);

        if (!order) {
          return res.status(404).json({
            success: false,
            message: `Order with ID ${req.params.id} not found`
          });
        }

        res.json({
          success: true,
          message: 'Order retrieved successfully',
          data: order
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    app.get('/orders', async (req, res) => {
      try {
        const Order = require('./models/Order');
        const { customerId, status, limit, offset } = req.query;

        const filters = {};
        if (customerId) filters.customerId = parseInt(customerId);
        if (status) filters.status = status;
        if (limit) filters.limit = parseInt(limit);
        if (offset) filters.offset = parseInt(offset);

        const orders = await Order.findAll(filters);

        res.json({
          success: true,
          message: 'Orders retrieved successfully',
          data: orders,
          total: orders.length
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    app.put('/order/:id/status', async (req, res) => {
      try {
        const Order = require('./models/Order');
        const { status } = req.body;

        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) {
          return res.status(404).json({
            success: false,
            message: `Order with ID ${req.params.id} not found`
          });
        }

        if ((status === 'shipped' || status === 'delivered') &&
          existingOrder.status !== 'shipped' &&
          existingOrder.status !== 'delivered') {
          try {
            const items = typeof existingOrder.items === 'string'
              ? JSON.parse(existingOrder.items)
              : existingOrder.items;

            if (items && Array.isArray(items) && items.length > 0) {
              for (const item of items) {
                if (item.ingredientId && item.quantity) {
                  try {
                    const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3000';
                    await axios.post(
                      `${inventoryUrl}/graphql`,
                      {
                        query: `
                          mutation UpdateStock($input: UpdateStockInput!) {
                            updateStock(input: $input) {
                              success
                              message
                            }
                          }
                        `,
                        variables: {
                          input: {
                            id: String(item.ingredientId),
                            quantityChange: -parseInt(item.quantity)
                          }
                        }
                      },
                      { timeout: 5000 }
                    );
                  } catch (inventoryError) {
                    console.error(`❌ Error reducing stock for ingredient ${item.ingredientId}:`, inventoryError.message);
                  }
                }
              }
            }
          } catch (stockError) {
            console.error('❌ Error processing stock reduction:', stockError.message);
          }
        }

        const order = await Order.updateStatus(req.params.id, status);

        res.json({
          success: true,
          message: `Order status updated to ${status}`,
          data: order
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
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
      console.log(`Order Management Service running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
