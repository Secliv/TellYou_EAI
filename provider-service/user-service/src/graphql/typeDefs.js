const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
    profile: UserProfile
  }

  type UserProfile {
    id: ID!
    userId: ID!
    fullName: String
    phone: String
    address: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String
    token: String
    user: User
  }

  type UserResponse {
    success: Boolean!
    message: String
    user: User
  }

  type UsersResponse {
    success: Boolean!
    message: String
    users: [User!]!
    total: Int!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    role: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
    role: String
  }

  input UpdateUserInput {
    username: String
    email: String
    role: String
  }

  input UpdateUserProfileInput {
    fullName: String
    phone: String
    address: String
  }

  type Query {
    # Get current authenticated user
    me: UserResponse!
    
    # Get all users (admin only)
    users: UsersResponse!
    
    # Get user by ID
    user(id: ID!): UserResponse!
    
    # Get user profile
    userProfile(userId: ID!): UserProfile
  }

  type Mutation {
    # Register new user (public)
    register(input: RegisterInput!): AuthResponse!
    
    # Login user (public)
    login(input: LoginInput!): AuthResponse!
    
    # Create user (admin only)
    createUser(input: CreateUserInput!): UserResponse!
    
    # Update user
    updateUser(id: ID!, input: UpdateUserInput!): UserResponse!
    
    # Delete user (admin only)
    deleteUser(id: ID!): UserResponse!
    
    # Update user profile
    updateUserProfile(userId: ID!, input: UpdateUserProfileInput!): UserProfile
  }
`;

module.exports = typeDefs;

