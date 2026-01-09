# Payment Processing Service

Microservice untuk memproses pembayaran dari toko kue setelah mereka melakukan pemesanan bahan kue.

## Endpoints

- `POST /payment` - Mengonfirmasi pembayaran dari toko kue
- `GET /payment-status` - Memeriksa status pembayaran

## Database

PostgreSQL dengan tabel:
- `payments` (id, order_id, amount, payment_status, payment_date)

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

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

type Query {
  # Memeriksa status pembayaran
  paymentStatus(id: ID!): Payment
  
  # Mendapatkan daftar pembayaran
  payments(orderId: ID): [Payment!]!
}

type Mutation {
  # Mengonfirmasi pembayaran dari toko kue
  confirmPayment(
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

