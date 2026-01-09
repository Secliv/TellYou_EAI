const { GraphQLError } = require('graphql');
const AuthService = require('../services/authService');
const UserService = require('../services/userService');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

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
    me: async (_, __, context) => {
      try {
        const user = requireAuth(context);
        const userData = await User.findById(user.id);
        
        if (!userData) {
          return {
            success: false,
            message: 'User not found',
            user: null,
          };
        }

        const profile = await UserProfile.findByUserId(user.id);

        return {
          success: true,
          message: 'User retrieved successfully',
          user: {
            ...userData,
            profile,
          },
        };
      } catch (error) {
        throw error;
      }
    },

    users: async (_, __, context) => {
      try {
        requireAdmin(context);
        const users = await UserService.getAllUsers();
        
        // Get profiles for each user
        const usersWithProfiles = await Promise.all(
          users.map(async (user) => {
            const profile = await UserProfile.findByUserId(user.id);
            return { ...user, profile };
          })
        );

        return {
          success: true,
          message: 'Users retrieved successfully',
          users: usersWithProfiles,
          total: usersWithProfiles.length,
        };
      } catch (error) {
        throw error;
      }
    },

    user: async (_, { id }, context) => {
      try {
        requireAuth(context);
        
        // Users can only view their own profile unless they're admin
        const user = context.user;
        if (user.role !== 'admin' && parseInt(user.id) !== parseInt(id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }

        const userData = await UserService.getUserById(id);
        
        if (!userData) {
          return {
            success: false,
            message: `User with ID ${id} not found`,
            user: null,
          };
        }

        const profile = await UserProfile.findByUserId(id);

        return {
          success: true,
          message: 'User retrieved successfully',
          user: {
            ...userData,
            profile,
          },
        };
      } catch (error) {
        throw error;
      }
    },

    userProfile: async (_, { userId }, context) => {
      try {
        requireAuth(context);
        
        // Users can only view their own profile unless they're admin
        const user = context.user;
        if (user.role !== 'admin' && parseInt(user.id) !== parseInt(userId)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }

        const profile = await UserProfile.findByUserId(userId);
        return profile;
      } catch (error) {
        throw error;
      }
    },
  },

  Mutation: {
    register: async (_, { input }) => {
      try {
        const result = await AuthService.register(input);
        return {
          success: true,
          message: 'User registered successfully',
          token: result.token,
          user: result.user,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          token: null,
          user: null,
        };
      }
    },

    login: async (_, { input }) => {
      try {
        const result = await AuthService.login(input.email, input.password);
        return {
          success: true,
          message: 'Login successful',
          token: result.token,
          user: result.user,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          token: null,
          user: null,
        };
      }
    },

    createUser: async (_, { input }, context) => {
      try {
        requireAdmin(context);
        const user = await UserService.createUser(input);
        const profile = await UserProfile.findByUserId(user.id);

        return {
          success: true,
          message: 'User created successfully',
          user: {
            ...user,
            profile,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          user: null,
        };
      }
    },

    updateUser: async (_, { id, input }, context) => {
      try {
        requireAuth(context);
        
        // Users can only update their own profile unless they're admin
        const user = context.user;
        if (user.role !== 'admin' && parseInt(user.id) !== parseInt(id)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }

        const updatedUser = await UserService.updateUser(id, input);
        const profile = await UserProfile.findByUserId(id);

        return {
          success: true,
          message: 'User updated successfully',
          user: {
            ...updatedUser,
            profile,
          },
        };
      } catch (error) {
        throw error;
      }
    },

    deleteUser: async (_, { id }, context) => {
      try {
        requireAdmin(context);
        await UserService.deleteUser(id);

        return {
          success: true,
          message: 'User deleted successfully',
          user: null,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          user: null,
        };
      }
    },

    updateUserProfile: async (_, { userId, input }, context) => {
      try {
        requireAuth(context);
        
        // Users can only update their own profile unless they're admin
        const user = context.user;
        if (user.role !== 'admin' && parseInt(user.id) !== parseInt(userId)) {
          throw new GraphQLError('Access denied', {
            extensions: {
              code: 'FORBIDDEN',
              http: { status: 403 },
            },
          });
        }

        const profile = await UserProfile.upsert(userId, input);
        return profile;
      } catch (error) {
        throw error;
      }
    },
  },
};

module.exports = resolvers;

