# Summary: JWT Authentication untuk Semua GraphQL Services

## Status Authentication

Semua GraphQL services sekarang **MEMERLUKAN JWT TOKEN** untuk mengakses endpoint (kecuali register/login di user-service).

### Services yang Sudah Diperbaiki:

1. ✅ **user-service** (port 3000)
   - Public: `register`, `login`
   - Requires Auth: Semua query dan mutation lainnya
   - Requires Admin: `createUser`, `deleteUser`, `users` (query), `statistics`

2. ✅ **inventory-service** (port 3001)
   - Requires Auth: Semua query dan mutation
   - Requires Admin: `createInventory`, `updateInventory`, `deleteInventory`
   - Requires Auth (any user): `inventories`, `inventory`, `inventoryStats`, `lowStockItems`, `updateStock`

3. ✅ **payment-service** (port 3002)
   - Requires Auth: Semua query dan mutation
   - Requires Admin: `confirmPayment`, `updatePaymentStatus`, `paymentStats`
   - Requires Auth (any user): `payments`, `payment`, `paymentByOrder`, `createPayment`

4. ✅ **order-service** (port 3003)
   - Requires Auth: Semua query dan mutation
   - Requires Admin: `deleteOrder`, `updateOrderStatus` (untuk status selain cancel)
   - Requires Auth (any user): `order`, `orders`, `orderStatus`, `createOrder`, `updateOrder`, `cancelOrder`
   - Users hanya bisa melihat/mengelola order mereka sendiri (kecuali admin)

5. ✅ **stock-payment-service** (port 3004)
   - Requires Auth: Semua query dan mutation
   - Requires Admin: `statistics`, `confirmPayment`
   - Requires Auth (any user): `transactions`, `transaction`, `createTransaction`

## Cara Menggunakan

### 1. Login/Register untuk Mendapatkan Token

Buka GraphQL Playground di `http://localhost:3000/graphql`:

```graphql
mutation {
  login(input: {
    email: "admin@example.com"
    password: "password123"
  }) {
    success
    token
    user {
      id
      email
      role
    }
  }
}
```

**Simpan token yang didapat!**

### 2. Gunakan Token di Semua GraphQL Services

Di GraphQL Playground, tambahkan di tab **HTTP HEADERS**:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

### 3. Test Authentication

Coba akses query/mutation **TANPA** token - seharusnya mendapat error:

```json
{
  "errors": [
    {
      "message": "Authentication required. Please login first and provide a valid JWT token in the Authorization header.",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "http": {
          "status": 401
        }
      }
    }
  ],
  "data": null
}
```

## Endpoints GraphQL

- **User Service**: `http://localhost:3000/graphql`
- **Inventory Service**: `http://localhost:3001/graphql`
- **Payment Service**: `http://localhost:3002/graphql`
- **Order Service**: `http://localhost:3003/graphql`
- **Stock-Payment Service**: `http://localhost:3004/graphql`

## Role-Based Access Control

### User Role (default)
- Bisa melihat data mereka sendiri
- Bisa membuat order/payment untuk diri sendiri
- Bisa cancel order mereka sendiri

### Admin Role
- Bisa melihat semua data
- Bisa melakukan semua operasi
- Bisa mengelola users, inventory, payments, orders

## Environment Variables

Pastikan semua services menggunakan `JWT_SECRET` yang sama di `docker-compose.yml`:

```yaml
environment:
  - JWT_SECRET=your-secret-key-here-should-be-changed-in-production
```

## Troubleshooting

### Error: "Authentication required"
- Pastikan Anda sudah login dan mendapatkan token
- Pastikan token ditambahkan di HTTP HEADERS dengan format: `Bearer YOUR_TOKEN`
- Pastikan token belum expired (default: 24 jam)

### Error: "Admin access required"
- Login dengan user yang memiliki role `admin`
- Atau buat user baru dengan role `admin` saat register

### Error: "Access denied"
- Anda mencoba mengakses data yang bukan milik Anda
- Hanya admin yang bisa mengakses semua data

## Testing Checklist

- [ ] Login tanpa token → Error authentication
- [ ] Query dengan token user → Success
- [ ] Query dengan token admin → Success
- [ ] Mutation admin-only dengan token user → Error "Admin access required"
- [ ] Mutation admin-only dengan token admin → Success
- [ ] Access data orang lain dengan token user → Error "Access denied"
- [ ] Access data orang lain dengan token admin → Success

