-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Tabel pesanan bahan kue dari customer';
COMMENT ON COLUMN orders.items IS 'JSON array of order items [{ingredient_id, name, quantity, price}]';
COMMENT ON COLUMN orders.status IS 'Status: pending, confirmed, processing, shipped, delivered, cancelled';




