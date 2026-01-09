const pool = require('../config/database');

class Payment {
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM payments
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }
    
    if (filters.customerId) {
      conditions.push(`customer_id = $${paramCount++}`);
      values.push(filters.customerId);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM payments
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = `
      SELECT 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM payments
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows[0];
  }

  static async findAllByOrderId(orderId) {
    const query = `
      SELECT 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
      FROM payments
      WHERE order_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async create(data) {
    const { orderId, customerId, customerName, amount, paymentMethod, notes } = data;
    
    const query = `
      INSERT INTO payments (order_id, customer_id, customer_name, amount, payment_method, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [
      orderId, customerId, customerName || null, amount, 
      paymentMethod || 'transfer', notes || null
    ]);
    
    return result.rows[0];
  }

  static async confirmPayment(id) {
    const query = `
      UPDATE payments
      SET status = 'confirmed', payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'confirmed', 'failed', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const query = `
      UPDATE payments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING 
        id, order_id as "orderId", customer_id as "customerId",
        customer_name as "customerName", amount, payment_method as "paymentMethod",
        status, 
        CASE 
          WHEN payment_date IS NOT NULL 
          THEN TO_CHAR(payment_date + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"')
          ELSE NULL
        END as "paymentDate",
        notes,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "createdAt",
        TO_CHAR(updated_at + INTERVAL '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async count() {
    const result = await pool.query('SELECT COUNT(*) as count FROM payments');
    return parseInt(result.rows[0].count);
  }

  static async getTotalRevenue() {
    // Only count the first confirmed payment for each order to avoid duplicate counting
    // This ensures revenue only counts one payment per order, even if multiple payments exist
    const result = await pool.query(`
      WITH first_confirmed_payments AS (
        SELECT DISTINCT ON (order_id) 
          order_id, 
          amount
        FROM payments
        WHERE status = 'confirmed'
        ORDER BY order_id, created_at ASC
      )
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM first_confirmed_payments
    `);
    return parseFloat(result.rows[0].total);
  }
}

module.exports = Payment;



