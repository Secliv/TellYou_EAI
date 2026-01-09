const { GraphQLError } = require('graphql');
const TransactionService = require("../services/TransactionService");

// Helper function to check authentication
const requireAuth = (context) => {
  // Strict check - context must exist and user must be truthy
  if (!context) {
    console.log('❌ Authentication failed - no context provided');
    throw new GraphQLError('Authentication required. Please login first and provide a valid JWT token in the Authorization header.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  
  // Check if user is null, undefined, or falsy
  if (context.user === null || context.user === undefined) {
    console.log('❌ Authentication failed - user is null/undefined in context');
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
        // Get all transactions
        transactions: async (_, __, context) => {
            try {
                requireAuth(context);
                return await TransactionService.getTransactions(50, 0);
            } catch (error) {
                // Don't wrap GraphQL errors (they should be thrown as-is)
                if (error.extensions && error.extensions.code) {
                    throw error;
                }
                throw new Error(`Failed to fetch transactions: ${error.message}`);
            }
        },

        // Get transaction by ID
        transaction: async (_, { transaction_id }, context) => {
            try {
                requireAuth(context);
                return await TransactionService.getTransactionById(transaction_id);
            } catch (error) {
                // Don't wrap GraphQL errors (they should be thrown as-is)
                if (error.extensions && error.extensions.code) {
                    throw error;
                }
                throw new Error(`Failed to fetch transaction: ${error.message}`);
            }
        },

        // Get statistics
        statistics: async (_, __, context) => {
            try {
                requireAdmin(context);
                return await TransactionService.getStatistics();
            } catch (error) {
                // Don't wrap GraphQL errors (they should be thrown as-is)
                if (error.extensions && error.extensions.code) {
                    throw error;
                }
                throw new Error(`Failed to fetch statistics: ${error.message}`);
            }
        }
    },

    Mutation: {
        // Create new transaction
        createTransaction: async (_, { input }, context) => {
            // Check authentication first - throw immediately if not authenticated
            requireAuth(context);
            
            try {
                return await TransactionService.createTransaction(input, context);
            } catch (error) {
                // Don't wrap GraphQL errors (they should be thrown as-is)
                if (error.extensions && error.extensions.code) {
                    throw error;
                }
                // This is a service error, wrap it
                throw new GraphQLError(`Failed to create transaction: ${error.message}`, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                        http: { status: 500 },
                    },
                    originalError: error,
                });
            }
        },

        // Confirm payment
        confirmPayment: async (_, { input }, context) => {
            // Debug: Log context before auth check
            console.log('🔍 confirmPayment - Context check:', {
                hasContext: !!context,
                user: context?.user,
                userType: typeof context?.user,
                userIsNull: context?.user === null,
                userIsUndefined: context?.user === undefined,
                authHeader: context?.authHeader ? 'present' : 'missing'
            });
            
            // Check authentication first - throw immediately if not authenticated
            // This must be outside try-catch to ensure GraphQL errors are not wrapped
            try {
                requireAdmin(context);
                console.log('✅ Authentication passed');
            } catch (authError) {
                console.log('❌ Authentication failed:', authError.message);
                // Re-throw authentication errors immediately without wrapping
                throw authError;
            }
            
            try {
                return await TransactionService.confirmPayment(input, context);
            } catch (error) {
                // Don't wrap GraphQL errors (they should be thrown as-is)
                if (error.extensions && error.extensions.code) {
                    throw error;
                }
                // Check if it's an authentication-related error from service
                if (error.message && (error.message.includes('authentication') || error.message.includes('Authentication'))) {
                    throw new GraphQLError(error.message, {
                        extensions: {
                            code: 'UNAUTHENTICATED',
                            http: { status: 401 },
                        },
                    });
                }
                // This is a service error, wrap it
                throw new GraphQLError(`Failed to confirm payment: ${error.message}`, {
                    extensions: {
                        code: 'INTERNAL_SERVER_ERROR',
                        http: { status: 500 },
                    },
                    originalError: error,
                });
            }
        }
    }
};

module.exports = resolvers;