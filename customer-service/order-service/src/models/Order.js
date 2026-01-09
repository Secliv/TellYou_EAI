const pool = require('../config/database');

class Order {
  /**
   * Get all orders with optional filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        id, 
        customer_id as "customerId",
        customer_name as "customerName",
        items,
        total_price as "totalPrice",
        status,
        notes,
        shipping_address as "shippingAddress",
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM orders
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    if (filters.customerId) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(filters.customerId);
    }
    
    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(filters.limit);
    }
    
    if (filters.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(filters.offset);
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Find order by ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        id, 
        customer_id as "customerId",
        customer_name as "customerName",
        items,
        total_price as "totalPrice",
        status,
        notes,
        shipping_address as "shippingAddress",
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM orders
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Create new order
   */
  static async create(orderData) {
    const { 
      customerId, 
      customerName, 
      items, 
      totalPrice, 
      notes, 
      shippingAddress 
    } = orderData;
    
    const query = `
      INSERT INTO orders (
        customer_id, 
        customer_name, 
        items, 
        total_price, 
        notes, 
        shipping_address,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING 
        id, 
        customer_id as "customerId",
        customer_name as "customerName",
        items,
        total_price as "totalPrice",
        status,
        notes,
        shipping_address as "shippingAddress",
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [
      customerId,
      customerName,
      JSON.stringify(items),
      totalPrice,
      notes || null,
      shippingAddress || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Update order status
   */
  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const query = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, 
        customer_id as "customerId",
        customer_name as "customerName",
        items,
        total_price as "totalPrice",
        status,
        notes,
        shipping_address as "shippingAddress",
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  /**
   * Update order
   */
  static async update(id, orderData) {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (orderData.customerName !== undefined) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(orderData.customerName);
    }
    
    if (orderData.items !== undefined) {
      updates.push(`items = $${paramCount++}`);
      values.push(JSON.stringify(orderData.items));
    }
    
    if (orderData.totalPrice !== undefined) {
      updates.push(`total_price = $${paramCount++}`);
      values.push(orderData.totalPrice);
    }
    
    if (orderData.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(orderData.status);
    }
    
    if (orderData.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(orderData.notes);
    }
    
    if (orderData.shippingAddress !== undefined) {
      updates.push(`shipping_address = $${paramCount++}`);
      values.push(orderData.shippingAddress);
    }
    
    if (updates.length === 0) {
      return await this.findById(id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, 
        customer_id as "customerId",
        customer_name as "customerName",
        items,
        total_price as "totalPrice",
        status,
        notes,
        shipping_address as "shippingAddress",
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete order
   */
  static async delete(id) {
    const query = 'DELETE FROM orders WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get orders by customer ID
   */
  static async findByCustomerId(customerId) {
    return await this.findAll({ customerId });
  }

  /**
   * Get orders by status
   */
  static async findByStatus(status) {
    return await this.findAll({ status });
  }
}

module.exports = Order;

