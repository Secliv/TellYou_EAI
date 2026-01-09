import axios from 'axios'

const STOCK_PAYMENT_API_URL = import.meta.env.VITE_STOCK_PAYMENT_API_URL || 'http://localhost:3004'

const graphqlClient = axios.create({
  baseURL: `${STOCK_PAYMENT_API_URL}/graphql`,
  headers: { 'Content-Type': 'application/json' },
})

graphqlClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const executeQuery = async (query, variables = {}) => {
  try {
    const response = await graphqlClient.post('', { query, variables })
    
    // Check for GraphQL errors
    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors)
      throw new Error(response.data.errors[0]?.message || 'GraphQL error')
    }
    
    return response.data
  } catch (error) {
    console.error('Execute query error:', error)
    throw error
  }
}

const transactionService = {
  // Get all transactions (from Toko Kue and other external systems)
  getAll: async (filters = {}) => {
    const query = `
      query GetTransactions {
        transactions {
          success
          message
          transactions {
            transaction_id
            order_id
            external_order_id
            total_cost
            payment_status
            payment_method
            payment_id
            created_at
            payment_completed_at
            source_system
            currency
          }
          total
        }
      }
    `
    const result = await executeQuery(query, filters)
    return result.data.transactions
  },

  // Get transaction by ID
  getById: async (transaction_id) => {
    const query = `
      query GetTransaction($transaction_id: String!) {
        transaction(transaction_id: $transaction_id) {
          transaction_id
          order_id
          external_order_id
          total_cost
          payment_status
          payment_method
          payment_id
          created_at
          payment_completed_at
          source_system
          currency
          request_payload
          response_payload
        }
      }
    `
    const result = await executeQuery(query, { transaction_id })
    return result.data.transaction
  },

  // Get statistics
  getStats: async () => {
    const query = `
      query GetStatistics {
        statistics {
          total_transactions
          successful_transactions
          pending_transactions
          failed_transactions
          total_revenue
        }
      }
    `
    const result = await executeQuery(query)
    return result.data.statistics
  }
}

export default transactionService

