const typeDefs = `#graphql
  # Enum untuk status order
  enum OrderStatus {
    pending
    confirmed
    processing
    shipped
    delivered
    cancelled
  }

  # Type untuk item dalam order
  type OrderItem {
    ingredientId: Int!
    name: String!
    quantity: Int!
    price: Float!
    unit: String
  }

  # Type utama Order
  type Order {
    id: ID!
    customerId: Int!
    customerName: String
    items: [OrderItem!]!
    totalPrice: Float!
    status: OrderStatus!
    notes: String
    shippingAddress: String
    createdAt: String!
    updatedAt: String!
  }

  # Input untuk item order
  input OrderItemInput {
    ingredientId: Int!
    name: String!
    quantity: Int!
    price: Float!
    unit: String
  }

  # Input untuk membuat order baru
  input CreateOrderInput {
    customerId: Int!
    customerName: String
    items: [OrderItemInput!]!
    notes: String
    shippingAddress: String
  }

  # Input untuk update order
  input UpdateOrderInput {
    customerName: String
    items: [OrderItemInput!]
    notes: String
    shippingAddress: String
    status: OrderStatus
  }

  # Response type untuk operasi order
  type OrderResponse {
    success: Boolean!
    message: String
    order: Order
  }

  type OrdersResponse {
    success: Boolean!
    message: String
    orders: [Order!]
    total: Int
  }

  # Query definitions
  type Query {
    # Get order by ID - GET /order/{id}
    order(id: ID!): OrderResponse!
    
    # Get all orders with optional filters
    orders(
      customerId: Int
      status: OrderStatus
      limit: Int
      offset: Int
    ): OrdersResponse!
    
    # Get order status only
    orderStatus(id: ID!): OrderResponse!
  }

  # Mutation definitions
  type Mutation {
    # Create new order - POST /order
    createOrder(input: CreateOrderInput!): OrderResponse!
    
    # Update order status
    updateOrderStatus(id: ID!, status: OrderStatus!): OrderResponse!
    
    # Update order details
    updateOrder(id: ID!, input: UpdateOrderInput!): OrderResponse!
    
    # Cancel order
    cancelOrder(id: ID!): OrderResponse!
    
    # Delete order (admin only)
    deleteOrder(id: ID!): OrderResponse!
  }
`;

module.exports = typeDefs;




