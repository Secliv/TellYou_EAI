const typeDefs = `#graphql
  type InventoryItem {
    id: ID!
    name: String!
    description: String
    category: String
    quantity: Float!
    unit: String!
    price: Float!
    minStock: Float
    supplier: String
    createdAt: String
    updatedAt: String
  }

  input CreateInventoryInput {
    name: String!
    description: String
    category: String
    quantity: Float
    unit: String
    price: Float!
    minStock: Float
    supplier: String
  }

  input UpdateInventoryInput {
    name: String
    description: String
    category: String
    quantity: Float
    unit: String
    price: Float
    minStock: Float
    supplier: String
  }

  input UpdateStockInput {
    id: ID!
    quantityChange: Float!
  }

  type InventoryResponse {
    success: Boolean!
    message: String
    item: InventoryItem
  }

  type InventoriesResponse {
    success: Boolean!
    message: String
    items: [InventoryItem!]
    total: Int
  }

  type StatsResponse {
    success: Boolean!
    totalItems: Int
    lowStockItems: Int
    totalValue: Float
  }

  type Query {
    # GET /inventories - Get all inventory items
    inventories(category: String, search: String): InventoriesResponse!
    
    # Get single inventory item
    inventory(id: ID!): InventoryResponse!
    
    # Get inventory statistics
    inventoryStats: StatsResponse!
    
    # Get low stock items
    lowStockItems: InventoriesResponse!
  }

  type Mutation {
    # Create new inventory item
    createInventory(input: CreateInventoryInput!): InventoryResponse!
    
    # Update inventory item
    updateInventory(id: ID!, input: UpdateInventoryInput!): InventoryResponse!
    
    # POST /update-stock - Update stock quantity
    updateStock(input: UpdateStockInput!): InventoryResponse!
    
    # Delete inventory item
    deleteInventory(id: ID!): InventoryResponse!
  }
`;

module.exports = typeDefs;