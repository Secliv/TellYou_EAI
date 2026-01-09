const pool = require('../config/database');

class UserProfile {
  static async findByUserId(userId) {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        full_name as "fullName",
        phone,
        address,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_profiles
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async create(userId, profileData) {
    const { fullName, phone, address } = profileData;
    const query = `
      INSERT INTO user_profiles (user_id, full_name, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        user_id as "userId",
        full_name as "fullName",
        phone,
        address,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    const result = await pool.query(query, [userId, fullName, phone, address]);
    return result.rows[0];
  }

  static async update(userId, profileData) {
    const { fullName, phone, address } = profileData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }

    if (updates.length === 0) {
      return await this.findByUserId(userId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE user_profiles
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING 
        id,
        user_id as "userId",
        full_name as "fullName",
        phone,
        address,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async upsert(userId, profileData) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return await this.update(userId, profileData);
    } else {
      return await this.create(userId, profileData);
    }
  }
}

module.exports = UserProfile;

