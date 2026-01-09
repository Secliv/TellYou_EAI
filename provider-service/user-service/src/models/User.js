const pool = require('../config/database');

class User {
  static async findAll() {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.created_at as "createdAt", 
        u.updated_at as "updatedAt"
      FROM users u
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.created_at as "createdAt", 
        u.updated_at as "updatedAt"
      FROM users u
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.password_hash as "passwordHash",
        u.role, 
        u.created_at as "createdAt", 
        u.updated_at as "updatedAt"
      FROM users u
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.password_hash as "passwordHash",
        u.role, 
        u.created_at as "createdAt", 
        u.updated_at as "updatedAt"
      FROM users u
      WHERE u.username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async create(userData) {
    const { username, email, passwordHash, role } = userData;
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        username, 
        email, 
        role, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    const result = await pool.query(query, [username, email, passwordHash, role]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const { username, email, role } = userData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, 
        username, 
        email, 
        role, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;

