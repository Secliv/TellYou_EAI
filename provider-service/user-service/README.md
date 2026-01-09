# User Service

Microservice untuk menangani data pengguna (autentikasi, autorisasi, dan manajemen profil pengguna).

## Endpoints

- `GET /users` - Mendapatkan daftar pengguna
- `GET /users/{id}` - Mendapatkan detail pengguna berdasarkan ID
- `POST /users` - Membuat pengguna baru
- `PUT /users/{id}` - Memperbarui data pengguna
- `DELETE /users/{id}` - Menghapus pengguna
- `POST /auth/login` - Login pengguna
- `POST /auth/register` - Registrasi pengguna baru

## Database

PostgreSQL dengan tabel:
- `users` (id, username, email, password_hash, role, created_at, updated_at)
- `user_profiles` (id, user_id, full_name, phone, address, created_at, updated_at)

## GraphQL Schema

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  role: String!
  createdAt: String!
  updatedAt: String!
  profile: UserProfile
}

type UserProfile {
  id: ID!
  userId: ID!
  fullName: String
  phone: String
  address: String
  createdAt: String!
  updatedAt: String!
}

type AuthResponse {
  token: String!
  user: User!
}

type Query {
  # Mendapatkan daftar pengguna
  users: [User!]!
  
  # Mendapatkan detail pengguna berdasarkan ID
  user(id: ID!): User
  
  # Mendapatkan profil pengguna
  userProfile(userId: ID!): UserProfile
}

type Mutation {
  # Membuat pengguna baru
  createUser(
    username: String!
    email: String!
    password: String!
    role: String!
  ): User!
  
  # Memperbarui data pengguna
  updateUser(
    id: ID!
    username: String
    email: String
    role: String
  ): User!
  
  # Menghapus pengguna
  deleteUser(id: ID!): Boolean!
  
  # Update profil pengguna
  updateUserProfile(
    userId: ID!
    fullName: String
    phone: String
    address: String
  ): UserProfile!
  
  # Registrasi pengguna baru
  register(
    username: String!
    email: String!
    password: String!
    role: String!
  ): AuthResponse!
  
  # Login pengguna
  login(email: String!, password: String!): AuthResponse!
}
```

## Menjalankan

```bash
npm install
npm run dev
```

