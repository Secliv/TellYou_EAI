const db = require("../config/database");

class TransactionModel {
    /**
     * Create new transaction in fact table
     */
    static async createTransaction(data) {
        const query = `
        INSERT INTO fact_transactions (
            transaction_id, external_order_id, order_id, payment_id,
            total_cost, payment_status, payment_method, currency,
            stock_before, stock_after, source_system, request_payload
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `;
        
        const values = [
        data.transaction_id,
        data.external_order_id || null,
        data.order_id || null,
        data.payment_id || null,
        data.total_cost,
        data.payment_status || 'PENDING',
        data.payment_method || null,
        data.currency || 'IDR',
        JSON.stringify(data.stock_before || {}),
        JSON.stringify(data.stock_after || {}),
        data.source_system || 'EXTERNAL',
        JSON.stringify(data.request_payload || {})
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Get all transactions
     */
    static async getAllTransactions(limit = 50, offset = 0) {
        const query = `
        SELECT 
            id,
            transaction_id,
            external_order_id,
            order_id,
            payment_id,
            total_cost,
            payment_status,
            payment_method,
            currency,
            source_system,
            created_at,
            updated_at,
            payment_completed_at
        FROM fact_transactions 
        WHERE is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `;
        
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }

    /**
     * Find transaction by transaction_id
     */
    static async findByTransactionId(transactionId) {
        const query = `
        SELECT * FROM fact_transactions 
        WHERE transaction_id = $1 AND is_deleted = FALSE
        `;
        
        const result = await db.query(query, [transactionId]);
        return result.rows[0] || null;
    }

    /**
     * Find transaction by external_order_id
     */
    static async findByExternalOrderId(externalOrderId) {
        const query = `
        SELECT * FROM fact_transactions 
        WHERE external_order_id = $1 AND is_deleted = FALSE
        `;
        
        const result = await db.query(query, [externalOrderId]);
        return result.rows[0] || null;
    }

    /**
     * Update transaction
     */
    static async updateTransaction(transactionId, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Dynamic update builder
        Object.keys(data).forEach(key => {
        if (['stock_before', 'stock_after', 'response_payload', 'request_payload'].includes(key)) {
            fields.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(data[key]));
        } else {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
        }
        paramCount++;
        });

        values.push(transactionId);

        const query = `
        UPDATE fact_transactions 
        SET ${fields.join(', ')}
        WHERE transaction_id = $${paramCount}
        RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Get transactions by status
     */
    static async findByStatus(status, limit = 50) {
        const query = `
        SELECT * FROM fact_transactions 
        WHERE payment_status = $1 AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $2
        `;
        
        const result = await db.query(query, [status, limit]);
        return result.rows;
    }

    /**
     * Get transaction statistics
     */
    static async getStatistics() {
        const query = `
        SELECT 
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN payment_status = 'SUCCESS' THEN 1 END) as successful_payments,
            COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_payments,
            COUNT(CASE WHEN payment_status = 'FAILED' THEN 1 END) as failed_payments,
            SUM(CASE WHEN payment_status = 'SUCCESS' THEN total_cost ELSE 0 END) as total_revenue
        FROM fact_transactions
        WHERE is_deleted = FALSE
        `;
        
        const result = await db.query(query);
        return result.rows[0];
    }
}

module.exports = TransactionModel;