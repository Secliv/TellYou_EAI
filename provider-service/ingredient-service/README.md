# Ingredient Management Service

Microservice untuk mengelola bahan kue, memperbarui stok, dan menangani pesanan dari toko kue.

## Endpoints

- `GET /ingredients` - Mendapatkan daftar bahan kue yang tersedia
- `POST /order` - Membuat pesanan bahan kue
- `POST /update-stock` - Memperbarui stok bahan kue setelah pesanan diterima

## Database

PostgreSQL dengan tabel:
- `ingredients` (id, name, stock, price, supplier_id)
- `orders` (id, ingredient_id, quantity, order_status, customer_id)

## Menjalankan

```bash
npm install
npm run dev
```

