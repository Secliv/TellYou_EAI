const typeDefs = `#graphql
  enum PaymentStatus {
    pending
    confirmed
    failed
    refunded
  }

  enum PaymentMethod {
    transfer
    cash
    credit_card
    e_wallet
  }

  type Payment {
    id: ID!
    orderId: Int!
    customerId: Int!
    customerName: String
    amount: Float!
    paymentMethod: String!
    status: PaymentStatus!
    paymentDate: String
    notes: String
    createdAt: String
    updatedAt: String
  }

  input CreatePaymentInput {
    orderId: Int!
    customerId: Int!
    customerName: String
    amount: Float!
    paymentMethod: String
    notes: String
  }

  type PaymentResponse {
    success: Boolean!
    message: String
    payment: Payment
  }

  type PaymentsResponse {
    success: Boolean!
    message: String
    payments: [Payment!]
    total: Int
  }

  type PaymentStatsResponse {
    success: Boolean!
    totalPayments: Int
    confirmedPayments: Int
    pendingPayments: Int
    totalRevenue: Float
  }

  type Query {
    # Get all payments
    payments(status: PaymentStatus, customerId: Int): PaymentsResponse!
    
    # GET /payment-status - Get payment by ID
    payment(id: ID!): PaymentResponse!
    
    # Get payment by order ID
    paymentByOrder(orderId: Int!): PaymentResponse!
    
    # Get payment statistics
    paymentStats: PaymentStatsResponse!
  }

  type Mutation {
    # POST /payment - Create payment
    createPayment(input: CreatePaymentInput!): PaymentResponse!
    
    # Confirm payment
    confirmPayment(id: ID!): PaymentResponse!
    
    # Update payment status
    updatePaymentStatus(id: ID!, status: PaymentStatus!): PaymentResponse!
  }
`;

module.exports = typeDefs;



