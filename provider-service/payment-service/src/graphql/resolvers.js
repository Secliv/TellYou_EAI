const { GraphQLError } = require('graphql');
const Payment = require('../models/Payment');

// Helper function to check authentication
const requireAuth = (context) => {
  // Strict check - context must exist and user must be truthy
  if (!context) {
    console.log('❌ Payment Service - Authentication failed - no context provided');
    throw new GraphQLError('Authentication required. Please login first and provide a valid JWT token in the Authorization header.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  
  // Check if user is null, undefined, or falsy
  if (context.user === null || context.user === undefined) {
    console.log('❌ Payment Service - Authentication failed - user is null/undefined in context');
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
    payments: async (_, { status, customerId }, context) => {
      const user = requireAuth(context);
      try {
        const filters = {};
        
        // Non-admin users can only see their own payments
        if (user.role !== 'admin') {
          filters.customerId = user.id;
        } else if (customerId) {
          filters.customerId = customerId;
        }
        
        if (status) filters.status = status;
        
        const payments = await Payment.findAll(filters);
        
        return {
          success: true,
          message: 'Payments retrieved successfully',
          payments,
          total: payments.length
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payments: [],
          total: 0
        };
      }
    },

    // GET /payment-status
    payment: async (_, { id }, context) => {
      const user = requireAuth(context);
      try {
        const payment = await Payment.findById(id);
        
        if (!payment) {
          return {
            success: false,
            message: `Payment with ID ${id} not found`,
            payment: null
          };
        }
        
        // Non-admin users can only view their own payments
        if (user.role !== 'admin' && payment.customerId && parseInt(payment.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        return {
          success: true,
          message: 'Payment retrieved successfully',
          payment
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payment: null
        };
      }
    },

    paymentByOrder: async (_, { orderId }, context) => {
      const user = requireAuth(context);
      try {
        const payment = await Payment.findByOrderId(orderId);
        
        if (!payment) {
          return {
            success: false,
            message: `Payment for order ${orderId} not found`,
            payment: null
          };
        }
        
        // Non-admin users can only view their own payments
        if (user.role !== 'admin' && payment.customerId && parseInt(payment.customerId) !== parseInt(user.id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }
        
        return {
          success: true,
          message: 'Payment retrieved successfully',
          payment
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payment: null
        };
      }
    },

    paymentStats: async (_, __, context) => {
      requireAdmin(context);
      try {
        const all = await Payment.findAll();
        const confirmed = all.filter(p => p.status === 'confirmed');
        const pending = all.filter(p => p.status === 'pending');
        const totalRevenue = await Payment.getTotalRevenue();
        
        return {
          success: true,
          totalPayments: all.length,
          confirmedPayments: confirmed.length,
          pendingPayments: pending.length,
          totalRevenue
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          totalPayments: 0,
          confirmedPayments: 0,
          pendingPayments: 0,
          totalRevenue: 0
        };
      }
    }
  },

  Mutation: {
    // POST /payment
    createPayment: async (_, { input }, context) => {
      const user = requireAuth(context);
      try {
        // Non-admin users can only create payments for their own orders
        const finalInput = { ...input };
        if (user.role !== 'admin') {
          finalInput.customerId = user.id;
        }
        
        // Check if ANY payment already exists for this order (check all payments, not just one)
        const existingPayments = await Payment.findAllByOrderId(finalInput.orderId);
        
        if (existingPayments && existingPayments.length > 0) {
          // Check if any payment is already confirmed
          const confirmedPayment = existingPayments.find(p => p.status === 'confirmed');
          if (confirmedPayment) {
            return {
              success: false,
              message: `Pembayaran untuk Order #${finalInput.orderId} sudah dikonfirmasi. Tidak dapat membuat pembayaran baru untuk order yang sama.`,
              payment: null
            };
          }
          
          // Check if there's any pending payment
          const pendingPayment = existingPayments.find(p => p.status === 'pending');
          if (pendingPayment) {
            return {
              success: false,
              message: `Pembayaran untuk Order #${finalInput.orderId} sudah ada dengan status "Menunggu Konfirmasi". Silakan tunggu konfirmasi admin atau hubungi customer service.`,
              payment: null
            };
          }
          
          // If payment exists with other status (failed, refunded), still prevent duplicate
          return {
            success: false,
            message: `Pembayaran untuk Order #${finalInput.orderId} sudah ada. Tidak dapat membuat pembayaran baru untuk order yang sama.`,
            payment: null
          };
        }
        
        const payment = await Payment.create(finalInput);
        
        return {
          success: true,
          message: 'Payment created successfully',
          payment
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payment: null
        };
      }
    },

    confirmPayment: async (_, { id }, context) => {
      // Debug: Log context before auth check
      console.log('🔍 Payment Service confirmPayment - Context check:', {
        hasContext: !!context,
        user: context?.user,
        userType: typeof context?.user,
        userIsNull: context?.user === null,
        userIsUndefined: context?.user === undefined
      });
      
      // Check authentication first - throw immediately if not authenticated
      try {
        requireAdmin(context);
        console.log('✅ Payment Service - Authentication passed');
      } catch (authError) {
        console.log('❌ Payment Service - Authentication failed:', authError.message);
        throw authError;
      }
      
      try {
        const existing = await Payment.findById(id);
        
        if (!existing) {
          return {
            success: false,
            message: `Payment with ID ${id} not found`,
            payment: null
          };
        }
        
        if (existing.status === 'confirmed') {
          return {
            success: false,
            message: 'Payment already confirmed',
            payment: existing
          };
        }
        
        const payment = await Payment.confirmPayment(id);
        
        return {
          success: true,
          message: 'Payment confirmed successfully',
          payment
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payment: null
        };
      }
    },

    updatePaymentStatus: async (_, { id, status }, context) => {
      requireAdmin(context);
      try {
        const existing = await Payment.findById(id);
        
        if (!existing) {
          return {
            success: false,
            message: `Payment with ID ${id} not found`,
            payment: null
          };
        }
        
        const payment = await Payment.updateStatus(id, status);
        
        return {
          success: true,
          message: `Payment status updated to ${status}`,
          payment
        };
      } catch (error) {
        if (error.extensions) {
          throw error;
        }
        return {
          success: false,
          message: error.message,
          payment: null
        };
      }
    }
  }
};

module.exports = resolvers;



