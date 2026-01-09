const { GraphQLError } = require('graphql');
const Order = require('../models/Order');
const axios = require('axios');

// Helper function to check authentication
const requireAuth = (context) => {
  // Strict check - context must exist and user must be truthy
  if (!context) {
    throw new GraphQLError('Authentication required. Please login first and provide a valid JWT token in the Authorization header.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  
  // Check if user is null, undefined, or falsy
  if (context.user === null || context.user === undefined) {
    throw new GraphQLError('Authentication required. Please login first and provide a valid JWT token in the Authorization header.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  
  return context.user;
};

// Helper function to check admin role
const requireAdmin = (context) => {
  const user = requireAuth(context);
  if (user.role !== 'admin') {
    throw new GraphQLError('Admin access required', {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
  return user;
};

const resolvers = {
  Query: {
    // GET /order/{id} - Get order by ID
    order: async (_, { id }, context) => {
      const user = requireAuth(context);
      try {
        const order = await Order.findById(id);
        
        if (!order) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        // Users can only view their own orders unless they're admin
        if (user.role !== 'admin' && order.customerId && parseInt(order.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        return {
          success: true,
          message: 'Order retrieved successfully',
          order
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    },

    // Get all orders with filters
    orders: async (_, { customerId, status, limit, offset }, context) => {
      try {
        const user = requireAuth(context);
        const filters = {};
        
        // Non-admin users can only see their own orders
        if (user.role !== 'admin') {
          filters.customerId = user.id;
        } else if (customerId) {
          filters.customerId = customerId;
        }
        
        if (status) filters.status = status;
        if (limit) filters.limit = limit;
        if (offset) filters.offset = offset;
        
        const orders = await Order.findAll(filters);
        
        return {
          success: true,
          message: 'Orders retrieved successfully',
          orders,
          total: orders.length
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          orders: [],
          total: 0
        };
      }
    },

    // Get order status only
    orderStatus: async (_, { id }, context) => {
      const user = requireAuth(context);
      try {
        const order = await Order.findById(id);
        
        if (!order) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        // Users can only view their own orders unless they're admin
        if (user.role !== 'admin' && order.customerId && parseInt(order.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        return {
          success: true,
          message: `Order status: ${order.status}`,
          order
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    }
  },

  Mutation: {
    // POST /order - Create new order
    createOrder: async (_, { input }, context) => {
      const user = requireAuth(context);
      try {
        const { customerId, customerName, items, notes, shippingAddress } = input;
        
        // Validate items
        if (!items || items.length === 0) {
          return {
            success: false,
            message: 'Order must contain at least one item',
            order: null
          };
        }
        
        // Non-admin users can only create orders for themselves
        const finalCustomerId = user.role === 'admin' ? (customerId || user.id) : user.id;
        const finalCustomerName = customerName || user.email;
        
        // Calculate total price
        const totalPrice = items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
        
        const order = await Order.create({
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          items,
          totalPrice,
          notes,
          shippingAddress
        });
        
        return {
          success: true,
          message: 'Order created successfully',
          order
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    },

    // Update order status
    updateOrderStatus: async (_, { id, status }, context) => {
      const user = requireAuth(context);
      try {
        const existingOrder = await Order.findById(id);
        
        if (!existingOrder) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        // Non-admin users can only update their own orders, and only to cancel
        if (user.role !== 'admin') {
          if (parseInt(existingOrder.customerId) !== parseInt(user.id)) {
            throw new GraphQLError('Access denied', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 },
              },
            });
          }
          if (status !== 'cancelled') {
            throw new GraphQLError('Only admin can update order status', {
              extensions: {
                code: 'FORBIDDEN',
                http: { status: 403 },
              },
            });
          }
        }
        
        // If status is being changed to 'shipped' or 'delivered', reduce inventory stock
        // Stock is reduced when order is shipped (Dikirim) to reflect actual inventory usage
        if ((status === 'shipped' || status === 'delivered') && 
            existingOrder.status !== 'shipped' && 
            existingOrder.status !== 'delivered') {
          try {
            // Parse items from order (items is stored as JSON string in database)
            const items = typeof existingOrder.items === 'string' 
              ? JSON.parse(existingOrder.items) 
              : existingOrder.items;
            
            if (items && Array.isArray(items) && items.length > 0) {
              // Reduce stock for each item in the order
              for (const item of items) {
                if (item.ingredientId && item.quantity) {
                  try {
                    // Call inventory service to reduce stock
                    const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3000';
                    const response = await axios.post(
                      `${inventoryUrl}/graphql`,
                      {
                        query: `
                          mutation UpdateStock($input: UpdateStockInput!) {
                            updateStock(input: $input) {
                              success
                              message
                              item {
                                id
                                name
                                quantity
                              }
                            }
                          }
                        `,
                        variables: {
                          input: {
                            id: String(item.ingredientId),
                            quantityChange: -parseInt(item.quantity) // Negative to reduce stock
                          }
                        }
                      },
                      {
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': context.authHeader || ''
                        },
                        timeout: 5000
                      }
                    );

                    if (response.data && response.data.data && response.data.data.updateStock) {
                      const result = response.data.data.updateStock;
                      if (result.success) {
                        console.log(`✅ Stock reduced for ingredient ${item.ingredientId}: ${item.quantity} ${item.unit || ''}`);
                      } else {
                        console.warn(`⚠️  Failed to reduce stock for ingredient ${item.ingredientId}: ${result.message}`);
                      }
                    }
                  } catch (inventoryError) {
                    console.error(`❌ Error reducing stock for ingredient ${item.ingredientId}:`, inventoryError.message);
                    // Continue with order status update even if inventory update fails
                    // This prevents order status update from failing due to inventory service issues
                  }
                }
              }
            }
          } catch (stockError) {
            console.error('❌ Error processing stock reduction:', stockError.message);
            // Continue with order status update even if stock reduction fails
          }
        }
        
        const order = await Order.updateStatus(id, status);
        
        return {
          success: true,
          message: `Order status updated to ${status}`,
          order
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    },

    // Update order details
    updateOrder: async (_, { id, input }, context) => {
      const user = requireAuth(context);
      try {
        const existingOrder = await Order.findById(id);
        
        if (!existingOrder) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        // Non-admin users can only update their own orders
        if (user.role !== 'admin' && parseInt(existingOrder.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        // Recalculate total if items are updated
        let updateData = { ...input };
        if (input.items && input.items.length > 0) {
          updateData.totalPrice = input.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
          }, 0);
        }
        
        const order = await Order.update(id, updateData);
        
        return {
          success: true,
          message: 'Order updated successfully',
          order
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    },

    // Cancel order
    cancelOrder: async (_, { id }, context) => {
      const user = requireAuth(context);
      try {
        const existingOrder = await Order.findById(id);
        
        if (!existingOrder) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        // Non-admin users can only cancel their own orders
        if (user.role !== 'admin' && parseInt(existingOrder.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        // Only allow cancellation for pending or confirmed orders
        if (!['pending', 'confirmed'].includes(existingOrder.status)) {
          return {
            success: false,
            message: `Cannot cancel order with status: ${existingOrder.status}`,
            order: null
          };
        }
        
        const order = await Order.updateStatus(id, 'cancelled');
        
        return {
          success: true,
          message: 'Order cancelled successfully',
          order
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    },

    // Delete order
    deleteOrder: async (_, { id }, context) => {
      requireAdmin(context);
      try {
        const existingOrder = await Order.findById(id);
        
        if (!existingOrder) {
          return {
            success: false,
            message: `Order with ID ${id} not found`,
            order: null
          };
        }
        
        await Order.delete(id);
        
        return {
          success: true,
          message: 'Order deleted successfully',
          order: existingOrder
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          order: null
        };
      }
    }
  }
};

module.exports = resolvers;




