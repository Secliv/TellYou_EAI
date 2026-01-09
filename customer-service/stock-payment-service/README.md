# Stock and Payment Update Service

Microservice untuk mengupdate stok bahan kue di toko setelah pesanan diterima dan memproses pembayaran.

## Endpoints

- `POST /update-stock` - Mengupdate stok bahan kue setelah menerima pasokan dari provider
- `POST /payment` - Memproses pembayaran setelah bahan kue diterima oleh toko

## Database

PostgreSQL dengan tabel:
- `payments` (id, order_id, amount, payment_status, payment_date)
- `stock_updates` (id, inventory_id, quantity, update_date)

## GraphQL Schema

```graphql
type Payment {
  id: ID!
  orderId: ID!
  amount: Float!
  paymentStatus: PaymentStatus!
  paymentDate: String
  createdAt: String
}

type StockUpdate {
  id: ID!
  inventoryId: ID!
  quantity: Int!
  updateDate: String!
  createdAt: String
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

type Query {
  # Mendapatkan daftar pembayaran
  payments(orderId: ID): [Payment!]!
  
  # Mendapatkan detail pembayaran
  payment(id: ID!): Payment
  
  # Mendapatkan daftar update stok
  stockUpdates(inventoryId: ID): [StockUpdate!]!
  
  # Mendapatkan detail update stok
  stockUpdate(id: ID!): StockUpdate
}

type Mutation {
  # Mengupdate stok bahan kue setelah menerima pasokan dari provider
  updateStock(
    inventoryId: ID!
    quantity: Int!
  ): StockUpdate!
  
  # Memproses pembayaran setelah bahan kue diterima oleh toko
  processPayment(
    orderId: ID!
    amount: Float!
  ): Payment!
  
  # Update status pembayaran
  updatePaymentStatus(
    id: ID!
    status: PaymentStatus!
  ): Payment!
}
```

## Menjalankan

```bash
npm install
npm run dev
```

