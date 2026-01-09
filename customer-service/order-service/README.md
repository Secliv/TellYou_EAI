# Order Management Service

Order Management Service adalah bagian dari Customer-Service dalam arsitektur microservices sistem manajemen bahan kue. Service ini bertanggung jawab untuk menangani pemesanan bahan kue dan melacak status pesanan.

## Teknologi

- **Node.js** - Runtime JavaScript
- **Express** - Web framework
- **Apollo Server 4** - GraphQL server
- **PostgreSQL** - Database
- **Docker** - Containerization

## Endpoints

### GraphQL Endpoint

**URL:** `http://localhost:3003/graphql`

#### Queries

```graphql
# Get order by ID
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

# Get all orders with filters
query GetOrders($customerId: Int, $status: OrderStatus, $limit: Int, $offset: Int) {
  orders(customerId: $customerId, status: $status, limit: $limit, offset: $offset) {
    success
    message
    orders {
      id
      customerId
      customerName
      totalPrice
      status
      createdAt
    }
    total
  }
}

# Get order status
query GetOrderStatus($id: ID!) {
  orderStatus(id: $id) {
    success
    message
    order {
      id
      status
    }
  }
}
```

#### Mutations

```graphql
# Create new order (POST /order)
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
      }
      totalPrice
      status
      createdAt
    }
  }
}

# Update order status
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

# Cancel order
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
```

### REST Endpoints (Backward Compatibility)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/order` | Membuat pesanan baru |
| GET | `/order/:id` | Menampilkan status pesanan |
| GET | `/orders` | Menampilkan semua pesanan |
| PUT | `/order/:id/status` | Update status pesanan |
| GET | `/health` | Health check |

## Contoh Request

### Create Order (REST)

```bash
curl -X POST http://localhost:3003/order \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "customerName": "Toko Kue Makmur",
    "items": [
      {
        "ingredientId": 1,
        "name": "Tepung Terigu",
        "quantity": 10,
        "price": 15000,
        "unit": "kg"
      },
      {
        "ingredientId": 2,
        "name": "Gula Pasir",
        "quantity": 5,
        "price": 12000,
        "unit": "kg"
      }
    ],
    "notes": "Pengiriman pagi hari",
    "shippingAddress": "Jl. Raya No. 123, Jakarta"
  }'
```

### Create Order (GraphQL)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { success message order { id totalPrice status } } }",
    "variables": {
      "input": {
        "customerId": 1,
        "customerName": "Toko Kue Makmur",
        "items": [
          {
            "ingredientId": 1,
            "name": "Tepung Terigu",
            "quantity": 10,
            "price": 15000
          }
        ]
      }
    }
  }'
```

### Get Order (REST)

```bash
curl http://localhost:3003/order/1
```

### Get Order (GraphQL)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetOrder($id: ID!) { order(id: $id) { success message order { id customerName items { name quantity price } totalPrice status createdAt } } }",
    "variables": { "id": "1" }
  }'
```

## Order Status

| Status | Description |
|--------|-------------|
| `pending` | Pesanan baru dibuat, menunggu konfirmasi |
| `confirmed` | Pesanan dikonfirmasi |
| `processing` | Pesanan sedang diproses |
| `shipped` | Pesanan sudah dikirim |
| `delivered` | Pesanan sudah diterima |
| `cancelled` | Pesanan dibatalkan |

## Database Schema

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  customer_name VARCHAR(100),
  items JSONB NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 15+

### Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Run migrations:
```bash
npm run migrate
```

4. Start the service:
```bash
npm run dev
```

### With Docker

```bash
docker-compose up order-service order-db
```

## Testing

```bash
npm test
```

## GraphQL Playground

Setelah service berjalan, akses GraphQL Playground di:
`http://localhost:3003/graphql`
