# Changelog - JWT Authentication Implementation

## [Latest] - JWT Authentication untuk Semua GraphQL Services

### Added

#### GraphQL API
- ✅ **User Service GraphQL** - GraphQL endpoint baru untuk user-service
  - Query: `me`, `users`, `user`, `userProfile`
  - Mutation: `register`, `login`, `createUser`, `updateUser`, `deleteUser`, `updateUserProfile`
  - Endpoint: `http://localhost:3000/graphql`

#### Authentication & Authorization
- ✅ **JWT Authentication** - Semua GraphQL endpoints sekarang memerlukan JWT token
- ✅ **Role-Based Access Control** - Admin dan User roles dengan permission berbeda
- ✅ **Strict Authentication Check** - Authentication check yang lebih ketat di semua services
- ✅ **Error Handling** - GraphQL errors untuk authentication tidak di-wrap

#### Documentation
- ✅ **GRAPHQL_AUTH_GUIDE.md** - Panduan lengkap GraphQL authentication
- ✅ **AUTHENTICATION_SUMMARY.md** - Summary authentication untuk semua services
- ✅ **QUICK_START.md** - Panduan cepat memulai project

### Changed

#### All Services
- ✅ Semua GraphQL resolvers sekarang memerlukan authentication
- ✅ Error handling diperbaiki untuk memastikan GraphQL errors tidak di-wrap
- ✅ Authentication check menggunakan strict validation (`context.user === null || context.user === undefined`)

#### User Service
- ✅ Menambahkan GraphQL endpoint (`/graphql`)
- ✅ Dependencies: Menambahkan `@apollo/server` dan `graphql`
- ✅ Public endpoints: Hanya `register` dan `login` mutation

#### Inventory Service
- ✅ Semua query dan mutation memerlukan authentication
- ✅ Admin-only: `createInventory`, `updateInventory`, `deleteInventory`
- ✅ Auth required: `inventories`, `inventory`, `inventoryStats`, `lowStockItems`, `updateStock`

#### Payment Service
- ✅ Semua query dan mutation memerlukan authentication
- ✅ Admin-only: `confirmPayment`, `updatePaymentStatus`, `paymentStats`
- ✅ Auth required: `payments`, `payment`, `paymentByOrder`, `createPayment`
- ✅ Users hanya bisa melihat payment mereka sendiri (kecuali admin)

#### Order Service
- ✅ Semua query dan mutation memerlukan authentication
- ✅ Admin-only: `deleteOrder`, `updateOrderStatus` (untuk status selain cancel)
- ✅ Auth required: Semua query dan mutation lainnya
- ✅ Users hanya bisa melihat/mengelola order mereka sendiri (kecuali admin)

#### Stock-Payment Service
- ✅ Semua query dan mutation memerlukan authentication
- ✅ Admin-only: `statistics`, `confirmPayment`
- ✅ Auth required: `transactions`, `transaction`, `createTransaction`
- ✅ Mock response tidak digunakan untuk auth errors

### Environment Variables

#### Updated
- ✅ **JWT_SECRET** - Sekarang diperlukan di semua services (harus sama di semua services)
- ✅ Semua services di `docker-compose.yml` sudah dikonfigurasi dengan `JWT_SECRET`

### Ports

| Service | Port | GraphQL | REST API |
|---------|------|---------|----------|
| User Service | 3000 | ✅ | ✅ |
| Inventory Service | 3001 | ✅ | ✅ |
| Payment Service | 3002 | ✅ | ✅ |
| Order Service | 3003 | ✅ | ✅ |
| Stock-Payment Service | 3004 | ✅ | ✅ |
| Frontend | 5174/5173 | - | - |

### Database Ports

| Database | Port |
|----------|------|
| user-db | 5438 |
| inventory-db | 5434 |
| payment-db | 5436 |
| order-db | 5435 |
| stock-payment-db | 5437 |

### Breaking Changes

⚠️ **Semua GraphQL endpoints sekarang memerlukan JWT token** (kecuali `register` dan `login` di user-service)

- Sebelumnya: GraphQL endpoints bisa diakses tanpa authentication
- Sekarang: Semua GraphQL endpoints memerlukan valid JWT token di Authorization header

### Migration Guide

1. **Login/Register** untuk mendapatkan JWT token:
   ```graphql
   mutation {
     login(input: { email: "...", password: "..." }) {
       token
     }
   }
   ```

2. **Gunakan token** di semua GraphQL requests:
   - Di GraphQL Playground: Tambahkan di HTTP HEADERS
   - Di REST API: Tambahkan di Authorization header

3. **Update environment variables**:
   - Pastikan `JWT_SECRET` sama di semua services
   - Rebuild containers setelah update environment variables

### Files Changed

#### New Files
- `provider-service/user-service/src/graphql/typeDefs.js`
- `provider-service/user-service/src/graphql/resolvers.js`
- `provider-service/user-service/src/utils/jwtHelper.js`
- `provider-service/inventory-service/src/utils/jwtHelper.js`
- `provider-service/payment-service/src/utils/jwtHelper.js`
- `customer-service/order-service/src/utils/jwtHelper.js`
- `customer-service/stock-payment-service/src/utils/jwtHelper.js`
- `GRAPHQL_AUTH_GUIDE.md`
- `AUTHENTICATION_SUMMARY.md`
- `QUICK_START.md`
- `CHANGELOG.md`

#### Modified Files
- `provider-service/user-service/src/index.js` - Menambahkan GraphQL server
- `provider-service/user-service/package.json` - Menambahkan dependencies
- `provider-service/inventory-service/src/graphql/resolvers.js` - Menambahkan auth check
- `provider-service/inventory-service/src/index.js` - Update context
- `provider-service/payment-service/src/graphql/resolvers.js` - Menambahkan auth check
- `provider-service/payment-service/src/index.js` - Update context
- `customer-service/order-service/src/graphql/resolvers.js` - Menambahkan auth check
- `customer-service/order-service/src/index.js` - Update context
- `customer-service/stock-payment-service/src/graphql/resolver.js` - Menambahkan auth check
- `customer-service/stock-payment-service/src/index.js` - Update context
- `customer-service/stock-payment-service/src/services/TransactionService.js` - Update untuk auth
- `docker-compose.yml` - Menambahkan JWT_SECRET ke semua services
- `README.md` - Update dengan informasi terbaru
- `STRUCTURE.md` - Update dengan informasi port dan authentication
- `SETUP.md` - Update dengan informasi GraphQL endpoints
- `ENV_SETUP.md` - Update dengan informasi JWT_SECRET

### Testing

Setelah update, pastikan untuk test:

1. ✅ Login/Register tanpa token → Success
2. ✅ Query dengan token → Success
3. ✅ Query tanpa token → Error authentication
4. ✅ Mutation admin-only dengan token user → Error "Admin access required"
5. ✅ Mutation admin-only dengan token admin → Success

