-- Create inventory table for cake ingredients
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10, 2) DEFAULT 0,
  supplier VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- Insert sample data
INSERT INTO inventory (name, description, category, quantity, unit, price, min_stock, supplier) VALUES
('Tepung Terigu', 'Tepung terigu protein tinggi untuk kue', 'Tepung', 100, 'kg', 15000, 20, 'PT Bogasari'),
('Gula Pasir', 'Gula pasir putih halus', 'Pemanis', 80, 'kg', 12000, 15, 'PT Sugar Group'),
('Mentega', 'Mentega tawar untuk kue', 'Lemak', 50, 'kg', 25000, 10, 'PT Indofood'),
('Telur', 'Telur ayam segar', 'Protein', 200, 'pcs', 2500, 50, 'PT Japfa'),
('Coklat Bubuk', 'Coklat bubuk premium', 'Perasa', 30, 'kg', 85000, 5, 'PT Van Houten'),
('Susu Bubuk', 'Susu bubuk full cream', 'Susu', 40, 'kg', 45000, 10, 'PT Frisian Flag'),
('Vanili', 'Ekstrak vanili murni', 'Perasa', 10, 'liter', 120000, 2, 'PT Aroma'),
('Baking Powder', 'Pengembang kue double acting', 'Pengembang', 25, 'kg', 35000, 5, 'PT Koepoe'),
('Krim Kental', 'Heavy cream untuk dekorasi', 'Susu', 30, 'liter', 55000, 5, 'PT Greenfields'),
('Keju Cheddar', 'Keju cheddar untuk topping', 'Keju', 20, 'kg', 95000, 3, 'PT Kraft');



