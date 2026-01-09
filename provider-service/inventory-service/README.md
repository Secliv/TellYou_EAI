# Inventory Management Service

Microservice untuk mengelola bahan kue, memperbarui stok, dan menangani pesanan dari toko kue.

## Endpoints

- `GET /inventories` - Mendapatkan daftar bahan kue yang tersedia
- `POST /order` - Membuat pesanan bahan kue
- `POST /update-stock` - Memperbarui stok bahan kue setelah pesanan diterima

## Database

PostgreSQL dengan tabel:
- `inventories` (id, name, stock, price, supplier_id)
- `orders` (id, inventory_id, quantity, order_status, customer_id)

## GraphQL Schema

```graphql
type Inventory {
  id: ID!
  name: String!
  stock: Int!
  price: Float!
  supplierId: ID!
}

type Order {
  id: ID!
  inventoryId: ID!
  inventory: Inventory
  quantity: Int!
  orderStatus: OrderStatus!
  customerId: ID!
  createdAt: String
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}

type Query {
  # Mendapatkan daftar bahan kue yang tersedia
  inventories: [Inventory!]!
  
  # Mendapatkan detail bahan berdasarkan ID
  inventory(id: ID!): Inventory
  
  # Mendapatkan daftar pesanan
  orders: [Order!]!
  
  # Mendapatkan detail pesanan berdasarkan ID
  order(id: ID!): Order
}

type Mutation {
  # Membuat pesanan bahan kue
  createOrder(
    inventoryId: ID!
    quantity: Int!
    customerId: ID!
  ): Order!
  
  # Memperbarui stok bahan kue setelah pesanan diterima
  updateStock(
    inventoryId: ID!
    quantity: Int!
  ): Inventory!
  
  # Update status pesanan
  updateOrderStatus(
    id: ID!
    status: OrderStatus!
  ): Order!
}
```

## Menjalankan

```bash
npm install
npm run dev
```

