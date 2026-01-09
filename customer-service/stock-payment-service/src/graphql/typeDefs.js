const typeDefs = `#graphql
    type Transaction {
        id: Int!
        transaction_id: String!
        external_order_id: String
        order_id: String
        payment_id: String
        total_cost: Float!
        payment_status: String!
        payment_method: String
        currency: String
        source_system: String
        created_at: String!
        updated_at: String
        payment_completed_at: String
    }

    type OrderResponse {
        success: Boolean!
        transaction_id: String!
        order_id: String!
        total_cost: Float!
        payment_status: String!
        message: String!
    }

    type PaymentResponse {
        success: Boolean!
        transaction_id: String!
        payment_status: String!
        payment_id: String!
        message: String!
    }

    type Statistics {
        total_transactions: String!
        successful_payments: String!
        pending_payments: String!
        failed_payments: String!
        total_revenue: String!
    }

    input OrderItem {
        product_id: String!
        quantity: Int!
        price: Float!
    }

    input OrderInput {
        external_order_id: String
        source_system: String
        items: [OrderItem!]!
        total_amount: Float
    }

    input PaymentInput {
        transaction_id: String!
        payment_method: String!
    }

    type Query {
        transactions: [Transaction!]!
        transaction(transaction_id: String!): Transaction
        statistics: Statistics!
    }

    type Mutation {
        createTransaction(input: OrderInput!): OrderResponse!
        confirmPayment(input: PaymentInput!): PaymentResponse!
    }
`;

module.exports = typeDefs;

