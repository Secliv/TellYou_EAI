import axios from 'axios'

const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3002'

const graphqlClient = axios.create({
  baseURL: `${PAYMENT_API_URL}/graphql`,
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

const paymentService = {
  getAll: async (filters = {}) => {
    const query = `
      query GetPayments($status: PaymentStatus, $customerId: Int) {
        payments(status: $status, customerId: $customerId) {
          success
          message
          payments {
            id
            orderId
            customerId
            customerName
            amount
            paymentMethod
            status
            paymentDate
            notes
            createdAt
          }
          total
        }
      }
    `
    const result = await executeQuery(query, filters)
    return result.data.payments
  },

  getById: async (id) => {
    const query = `
      query GetPayment($id: ID!) {
        payment(id: $id) {
          success
          message
          payment {
            id
            orderId
            customerId
            customerName
            amount
            paymentMethod
            status
            paymentDate
            notes
            createdAt
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.payment
  },

  // POST /payment
  create: async (data) => {
    const query = `
      mutation CreatePayment($input: CreatePaymentInput!) {
        createPayment(input: $input) {
          success
          message
          payment {
            id
            orderId
            amount
            status
          }
        }
      }
    `
    const result = await executeQuery(query, { input: data })
    return result.data.createPayment
  },

  confirm: async (id) => {
    const query = `
      mutation ConfirmPayment($id: ID!) {
        confirmPayment(id: $id) {
          success
          message
          payment {
            id
            status
            paymentDate
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.confirmPayment
  },

  getStats: async () => {
    const query = `
      query GetPaymentStats {
        paymentStats {
          success
          totalPayments
          confirmedPayments
          pendingPayments
          totalRevenue
        }
      }
    `
    const result = await executeQuery(query)
    return result.data.paymentStats
  }
}

export default paymentService



