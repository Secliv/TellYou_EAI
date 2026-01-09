const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');

// Create order (entry point untuk sistem eksternal)
router.post('/orders', TransactionController.createTransaction);

// Confirm payment
router.post('/payments/confirm', TransactionController.confirmPayment);

// Get all transactions
router.get('/transactions', TransactionController.getTransactions);

// Get transaction statistics
router.get('/transactions/stats', TransactionController.getStatistics);

// Get transaction by ID
router.get('/transactions/:transactionId', TransactionController.getTransactionById);

module.exports = router;