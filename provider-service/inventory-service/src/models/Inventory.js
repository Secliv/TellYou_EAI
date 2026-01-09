const pool = require('../config/database');

class Inventory {
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM inventory
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    if (filters.category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(filters.category);
    }
    
    if (filters.search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM inventory
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { name, description, category, quantity, unit, price, minStock, supplier } = data;
    
    const query = `
      INSERT INTO inventory (name, description, category, quantity, unit, price, min_stock, supplier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [
      name, description || null, category || null, 
      quantity || 0, unit || 'kg', price || 0, 
      minStock || 0, supplier || null
    ]);
    
    return result.rows[0];
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const fields = ['name', 'description', 'category', 'quantity', 'unit', 'price', 'supplier'];
    
    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    });
    
    if (data.minStock !== undefined) {
      updates.push(`min_stock = $${paramCount++}`);
      values.push(data.minStock);
    }
    
    if (updates.length === 0) {
      return await this.findById(id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE inventory
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStock(id, quantityChange) {
    const query = `
      UPDATE inventory
      SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [quantityChange, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM inventory WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async count() {
    const result = await pool.query('SELECT COUNT(*) as count FROM inventory');
    return parseInt(result.rows[0].count);
  }

  static async getLowStock() {
    const query = `
      SELECT 
        id, name, description, category, quantity, unit, price,
        min_stock as "minStock", supplier
      FROM inventory
      WHERE quantity <= min_stock
      ORDER BY quantity ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Inventory;



