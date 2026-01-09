const { GraphQLError } = require('graphql');
const Inventory = require('../models/Inventory');

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
    // GET /inventories
    inventories: async (_, { category, search }, context) => {
      requireAuth(context);
      try {
        const filters = {};
        if (category) filters.category = category;
        if (search) filters.search = search;
        
        const items = await Inventory.findAll(filters);
        
        return {
          success: true,
          message: 'Inventory items retrieved successfully',
          items,
          total: items.length
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          items: [],
          total: 0
        };
      }
    },

    inventory: async (_, { id }, context) => {
      // Exception: Service-to-service calls tidak memerlukan authentication
      // Cek jika request dari service (tidak ada user di context)
      // Untuk development, kita allow jika context.user tidak ada (service call)
      const isServiceCall = !context || !context.user || context.user === null || context.user === undefined;
      
      if (!isServiceCall) {
        requireAuth(context);
      } else {
        console.log('✅ Allowing service-to-service inventory query (no auth required)');
      }
      
      try {
        const item = await Inventory.findById(id);
        
        if (!item) {
          return {
            success: false,
            message: `Inventory item with ID ${id} not found`,
            item: null
          };
        }
        
        return {
          success: true,
          message: 'Inventory item retrieved successfully',
          item
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          item: null
        };
      }
    },

    inventoryStats: async (_, __, context) => {
      requireAuth(context);
      try {
        const items = await Inventory.findAll();
        const lowStock = await Inventory.getLowStock();
        
        const totalValue = items.reduce((sum, item) => {
          return sum + (item.quantity * item.price);
        }, 0);
        
        return {
          success: true,
          totalItems: items.length,
          lowStockItems: lowStock.length,
          totalValue
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          totalItems: 0,
          lowStockItems: 0,
          totalValue: 0
        };
      }
    },

    lowStockItems: async (_, __, context) => {
      requireAuth(context);
      try {
        const items = await Inventory.getLowStock();
        
        return {
          success: true,
          message: 'Low stock items retrieved',
          items,
          total: items.length
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          items: [],
          total: 0
        };
      }
    }
  },

  Mutation: {
    createInventory: async (_, { input }, context) => {
      requireAdmin(context);
      try {
        const item = await Inventory.create(input);
        
        return {
          success: true,
          message: 'Inventory item created successfully',
          item
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          item: null
        };
      }
    },

    updateInventory: async (_, { id, input }, context) => {
      requireAdmin(context);
      try {
        const existing = await Inventory.findById(id);
        
        if (!existing) {
          return {
            success: false,
            message: `Inventory item with ID ${id} not found`,
            item: null
          };
        }
        
        const item = await Inventory.update(id, input);
        
        return {
          success: true,
          message: 'Inventory item updated successfully',
          item
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          item: null
        };
      }
    },

    // POST /update-stock
    updateStock: async (_, { input }, context) => {
      requireAuth(context);
      try {
        const { id, quantityChange } = input;
        
        const existing = await Inventory.findById(id);
        
        if (!existing) {
          return {
            success: false,
            message: `Inventory item with ID ${id} not found`,
            item: null
          };
        }
        
        // Check if stock would go negative
        if (existing.quantity + quantityChange < 0) {
          return {
            success: false,
            message: `Insufficient stock. Current: ${existing.quantity}, Requested change: ${quantityChange}`,
            item: null
          };
        }
        
        const item = await Inventory.updateStock(id, quantityChange);
        
        return {
          success: true,
          message: `Stock updated. New quantity: ${item.quantity}`,
          item
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          item: null
        };
      }
    },

    deleteInventory: async (_, { id }, context) => {
      requireAdmin(context);
      try {
        const existing = await Inventory.findById(id);
        
        if (!existing) {
          return {
            success: false,
            message: `Inventory item with ID ${id} not found`,
            item: null
          };
        }
        
        await Inventory.delete(id);
        
        return {
          success: true,
          message: 'Inventory item deleted successfully',
          item: existing
        };
      } catch (error) {
        // Don't wrap GraphQL errors (they should be thrown as-is)
        if (error.extensions && error.extensions.code) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          item: null
        };
      }
    }
  }
};

module.exports = resolvers;



