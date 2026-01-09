import axios from 'axios'

const ORDER_API_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:3003'

// GraphQL client for order service
const graphqlClient = axios.create({
  baseURL: `${ORDER_API_URL}/graphql`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
graphqlClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// GraphQL query helper
const executeQuery = async (query, variables = {}) => {
  const response = await graphqlClient.post('', { query, variables })
  return response.data
}

// Order Service Functions
const orderService = {
  // Get all orders
  getAllOrders: async (filters = {}) => {
    const query = `
      query GetOrders($customerId: Int, $status: OrderStatus, $limit: Int, $offset: Int) {
        orders(customerId: $customerId, status: $status, limit: $limit, offset: $offset) {
          success
          message
          orders {
            id
            customerId
            customerName
            items {
              ingredientId
              name
              quantity
              price
              unit
            }
            totalPrice
            status
            notes
            shippingAddress
            createdAt
            updatedAt
          }
          total
        }
      }
    `
    const result = await executeQuery(query, filters)
    return result.data.orders
  },

  // Get order by ID
  getOrderById: async (id) => {
    const query = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          success
          message
          order {
            id
            customerId
            customerName
            items {
              ingredientId
              name
              quantity
              price
              unit
            }
            totalPrice
            status
            notes
            shippingAddress
            createdAt
            updatedAt
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.order
  },

  // Create new order
  createOrder: async (orderData) => {
    const query = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          success
          message
          order {
            id
            customerId
            customerName
            items {
              ingredientId
              name
              quantity
              price
              unit
            }
            totalPrice
            status
            createdAt
          }
        }
      }
    `
    const result = await executeQuery(query, { input: orderData })
    return result.data.createOrder
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    const query = `
      mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
        updateOrderStatus(id: $id, status: $status) {
          success
          message
          order {
            id
            status
            updatedAt
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id), status })
    return result.data.updateOrderStatus
  },

  // Cancel order
  cancelOrder: async (id) => {
    const query = `
      mutation CancelOrder($id: ID!) {
        cancelOrder(id: $id) {
          success
          message
          order {
            id
            status
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.cancelOrder
  },
}

export default orderService




