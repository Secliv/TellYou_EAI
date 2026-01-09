# GraphQL JWT Authorization Guide

## Setup

### 1. Pastikan Semua Services Running

Pastikan semua services sudah di-build dan running:

```bash
# Rebuild containers (karena ada perubahan dependencies)
docker-compose down
docker-compose build
docker-compose up -d

# Atau untuk specific service
docker-compose build user-service
docker-compose up -d user-service
```

### 2. Install Dependencies Baru

User-service memerlukan dependencies baru untuk GraphQL. Pastikan dependencies sudah terinstall:

```bash
# Jika running di local (bukan docker)
cd provider-service/user-service
npm install
```

Dependencies yang diperlukan:
- `@apollo/server`
- `graphql`

### 3. Akses GraphQL Playground

GraphQL endpoint tersedia di:
- **User Service**: `http://localhost:3000/graphql`
- **Inventory Service**: `http://localhost:3001/graphql`
- **Payment Service**: `http://localhost:3002/graphql`
- **Order Service**: `http://localhost:3003/graphql`
- **Stock-Payment Service**: `http://localhost:3004/graphql`

## Cara Menggunakan

### Step 1: Register atau Login untuk Mendapatkan JWT Token

Buka GraphQL Playground di `http://localhost:3000/graphql` dan jalankan mutation berikut:

```graphql
# Register (Public - tidak perlu token)
mutation {
  register(input: {
    username: "testuser"
    email: "test@example.com"
    password: "password123"
    role: "user"
  }) {
    success
    message
    token
    user {
      id
      username
      email
      role
    }
  }
}
```

ATAU

```graphql
# Login (Public - tidak perlu token)
mutation {
  login(input: {
    email: "test@example.com"
    password: "password123"
  }) {
    success
    message
    token
    user {
      id
      username
      email
      role
    }
  }
}
```

**Simpan token yang didapat dari response!**

### Step 2: Gunakan Token untuk Mengakses GraphQL

#### Di GraphQL Playground:

1. Buka GraphQL Playground (misalnya `http://localhost:3000/graphql` atau service lain)
2. Di bagian bawah, klik tab "HTTP HEADERS"
3. Tambahkan token:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

4. Sekarang Anda bisa menjalankan query yang memerlukan authentication

#### Contoh Query dengan Authentication:

```graphql
# Get current user info
query {
  me {
    success
    message
    user {
      id
      username
      email
      role
      profile {
        fullName
        phone
        address
      }
    }
  }
}

# Get all inventories (requires auth)
query {
  inventories {
    success
    message
    items {
      id
      name
      quantity
      price
    }
    total
  }
}

# Get orders (users hanya lihat order mereka sendiri)
query {
  orders {
    success
    message
    orders {
      id
      customerId
      status
      totalPrice
    }
    total
  }
}
```

## Troubleshooting

### Error: "Route not found" saat mengakses `/graphql`

**Solusi:**
1. Pastikan service sudah running:
   ```bash
   docker-compose ps
   ```
2. Cek logs untuk melihat apakah ada error:
   ```bash
   docker-compose logs user-service
   ```
3. Pastikan dependencies sudah terinstall (terutama `@apollo/server` dan `graphql`)
4. Rebuild container:
   ```bash
   docker-compose build user-service
   docker-compose up -d user-service
   ```

### Error: "Authentication required"

**Solusi:**
- Pastikan Anda sudah login dan mendapatkan token
- Pastikan token ditambahkan di HTTP HEADERS dengan format:
  ```json
  {
    "Authorization": "Bearer YOUR_TOKEN_HERE"
  }
  ```
- Pastikan token masih valid (tidak expired)
- Token default expire dalam 24 jam

### Error: "Admin access required"

**Solusi:**
- Operasi tertentu memerlukan role `admin`
- Login dengan user yang memiliki role `admin`
- Atau buat user baru dengan role `admin`:
  ```graphql
  mutation {
    register(input: {
      username: "admin"
      email: "admin@example.com"
      password: "admin123"
      role: "admin"
    }) {
      token
      user {
        id
        role
      }
    }
  }
  ```

### Error: "Invalid or expired token"

**Solusi:**
- Token mungkin sudah expired (default 24 jam)
- Login ulang untuk mendapatkan token baru
- Pastikan `JWT_SECRET` sama di semua services

## Endpoints yang Tidak Memerlukan Authentication

Hanya mutation berikut yang public (tidak perlu token):
- `register` - Registrasi user baru
- `login` - Login user

Semua endpoint lainnya memerlukan JWT token yang valid!

## Environment Variables

Pastikan semua services menggunakan `JWT_SECRET` yang sama:

```env
JWT_SECRET=your-secret-key-here-should-be-changed-in-production
```

Di `docker-compose.yml`, `JWT_SECRET` sudah dikonfigurasi untuk semua services.

