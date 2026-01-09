const TransactionService = require('../services/TransactionService');

class TransactionController {
    /**
     * POST /api/orders
     * Create new order (entry point untuk sistem eksternal)
     */
    static async createTransaction(req, res) {
        try {
        const result = await TransactionService.createTransaction(req.body);
        res.status(201).json(result);
        } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
        }
    }

    /**
     * POST /api/payments/confirm
     * Confirm payment
     */
    static async confirmPayment(req, res) {
        try {
        const result = await TransactionService.confirmPayment(req.body);
        res.status(200).json(result);
        } catch (error) {
        console.error('❌ Confirm payment error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
        }
    }

    /**
     * GET /api/transactions
     * Get all transactions
     */
    static async getTransactions(req, res) {
        try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const transactions = await TransactionService.getTransactions(limit, offset);
        
        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
        } catch (error) {
        console.error('❌ Get transactions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
        }
    }

    /**
     * GET /api/transactions/:transactionId
     * Get transaction by ID
     */
    static async getTransactionById(req, res) {
        try {
        const transaction = await TransactionService.getTransactionById(
            req.params.transactionId
        );
        
        res.status(200).json({
            success: true,
            data: transaction
        });
        } catch (error) {
        console.error('❌ Get transaction error:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
        }
    }

    /**
     * GET /api/transactions/stats
     * Get transaction statistics
     */
    static async getStatistics(req, res) {
        try {
        const stats = await TransactionService.getStatistics();
        
        res.status(200).json({
            success: true,
            data: stats
        });
        } catch (error) {
        console.error('❌ Get statistics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
        }
    }
}

module.exports = TransactionController;