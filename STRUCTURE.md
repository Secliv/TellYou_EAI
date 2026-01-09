# Struktur Project TELLYOU EAI

## Struktur Folder Lengkap

```
tellyou_eai/
├── .gitignore
├── README.md
├── STRUCTURE.md
├── docker-compose.yml
│
├── provider-service/                    # Container Besar: Provider-Service
│   ├── user-service/                    # Microservice 1: User Management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── graphql/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   └── index.js
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── inventory-service/              # Microservice 2: Inventory Management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── graphql/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   └── index.js
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── payment-service/                # Microservice 3: Payment Processing
│       ├── src/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── graphql/
│       │   ├── config/
│       │   ├── middleware/
│       │   └── index.js
│       ├── db/
│       │   ├── migrations/
│       │   └── seeds/
│       ├── tests/
│       ├── Dockerfile
│       ├── package.json
│       └── README.md
│
└── customer-service/                     # Container Besar: Customer-Service
    ├── order-service/                   # Microservice 4: Order Management
    │   ├── src/
    │   │   ├── controllers/
    │   │   ├── models/
    │   │   ├── routes/
    │   │   ├── services/
    │   │   ├── graphql/
    │   │   ├── config/
    │   │   ├── middleware/
    │   │   └── index.js
    │   ├── db/
    │   │   ├── migrations/
    │   │   └── seeds/
    │   ├── tests/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── README.md
    │
    └── stock-payment-service/          # Microservice 5: Stock & Payment Update
        ├── src/
        │   ├── controllers/
        │   ├── models/
        │   ├── routes/
        │   ├── services/
        │   ├── graphql/
        │   ├── config/
        │   ├── middleware/
        │   └── index.js
        ├── db/
        │   ├── migrations/
        │   └── seeds/
        ├── tests/
        ├── Dockerfile
        ├── package.json
        └── README.md
```

## Arsitektur Database

### Provider-Service

#### User Service
- **Database**: `user_db` (PostgreSQL)
- **Tabel**:
  - `users` (id, username, email, password_hash, role, created_at, updated_at)
  - `user_profiles` (id, user_id, full_name, phone, address, created_at, updated_at)

#### Inventory Management Service
- **Database**: `inventory_db` (PostgreSQL)
- **Tabel**:
  - `inventories` (id, name, stock, price, supplier_id)
  - `orders` (id, inventory_id, quantity, order_status, customer_id)

#### Payment Processing Service
- **Database**: `payment_db` (PostgreSQL)
- **Tabel**:
  - `payments` (id, order_id, amount, payment_status, payment_date)

### Customer-Service

#### Order Management Service
- **Database**: `order_db` (PostgreSQL)
- **Tabel**:
  - `orders` (id, customer_id, total_amount, order_date, order_status)

#### Stock and Payment Update Service
- **Database**: `stock_payment_db` (PostgreSQL)
- **Tabel**:
  - `payments` (id, order_id, amount, payment_status, payment_date)
  - `stock_updates` (id, inventory_id, quantity, update_date)

## Port Mapping

- **User Service**: `3000:3000`
- **Inventory Service**: `3001:3000`
- **Payment Service**: `3002:3000`
- **Order Service**: `3003:3000`
- **Stock-Payment Service**: `3004:3000`

## Network Architecture

- **provider-network**: Jaringan untuk microservices di Provider-Service
- **customer-network**: Jaringan untuk microservices di Customer-Service
- **shared-network**: Jaringan bersama untuk komunikasi antar container

## Prinsip Desain

1. **1 Layanan 1 Database**: Setiap microservice memiliki database terpisah
2. **Isolasi Data**: Data antar layanan terisolasi untuk mengurangi ketergantungan
3. **Container Besar**: Provider-Service dan Customer-Service sebagai container logis
4. **Microservices**: Setiap layanan dapat di-deploy dan di-scale secara independen

