import axios from 'axios'

const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || 'http://localhost:3001'

const graphqlClient = axios.create({
  baseURL: `${INVENTORY_API_URL}/graphql`,
  headers: { 'Content-Type': 'application/json' },
})

graphqlClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const executeQuery = async (query, variables = {}) => {
  const response = await graphqlClient.post('', { query, variables })
  return response.data
}

const inventoryService = {
  // GET /inventories
  getAll: async (filters = {}) => {
    const query = `
      query GetInventories($category: String, $search: String) {
        inventories(category: $category, search: $search) {
          success
          message
          items {
            id
            name
            description
            category
            quantity
            unit
            price
            minStock
            supplier
            createdAt
            updatedAt
          }
          total
        }
      }
    `
    const result = await executeQuery(query, filters)
    return result.data.inventories
  },

  getById: async (id) => {
    const query = `
      query GetInventory($id: ID!) {
        inventory(id: $id) {
          success
          message
          item {
            id
            name
            description
            category
            quantity
            unit
            price
            minStock
            supplier
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.inventory
  },

  create: async (data) => {
    const query = `
      mutation CreateInventory($input: CreateInventoryInput!) {
        createInventory(input: $input) {
          success
          message
          item {
            id
            name
            quantity
            price
          }
        }
      }
    `
    const result = await executeQuery(query, { input: data })
    return result.data.createInventory
  },

  update: async (id, data) => {
    const query = `
      mutation UpdateInventory($id: ID!, $input: UpdateInventoryInput!) {
        updateInventory(id: $id, input: $input) {
          success
          message
          item {
            id
            name
            quantity
            price
          }
        }
      }
    `
    const result = await executeQuery(query, { id: String(id), input: data })
    return result.data.updateInventory
  },

  // POST /update-stock
  updateStock: async (id, quantityChange) => {
    const query = `
      mutation UpdateStock($input: UpdateStockInput!) {
        updateStock(input: $input) {
          success
          message
          item {
            id
            name
            quantity
          }
        }
      }
    `
    const result = await executeQuery(query, { input: { id: String(id), quantityChange } })
    return result.data.updateStock
  },

  delete: async (id) => {
    const query = `
      mutation DeleteInventory($id: ID!) {
        deleteInventory(id: $id) {
          success
          message
        }
      }
    `
    const result = await executeQuery(query, { id: String(id) })
    return result.data.deleteInventory
  },

  getStats: async () => {
    const query = `
      query GetStats {
        inventoryStats {
          success
          totalItems
          lowStockItems
          totalValue
        }
      }
    `
    const result = await executeQuery(query)
    return result.data.inventoryStats
  },

  getLowStock: async () => {
    const query = `
      query GetLowStock {
        lowStockItems {
          success
          items {
            id
            name
            quantity
            minStock
            unit
          }
          total
        }
      }
    `
    const result = await executeQuery(query)
    return result.data.lowStockItems
  }
}

export default inventoryService
