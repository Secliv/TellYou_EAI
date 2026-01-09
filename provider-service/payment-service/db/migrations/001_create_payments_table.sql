-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  customer_name VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'transfer',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add comments
COMMENT ON TABLE payments IS 'Tabel pembayaran dari toko kue';
COMMENT ON COLUMN payments.status IS 'Status: pending, confirmed, failed, refunded';
COMMENT ON COLUMN payments.payment_method IS 'Method: transfer, cash, credit_card, e-wallet';



