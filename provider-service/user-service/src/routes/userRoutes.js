const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all users (protected route)
router.get('/', authMiddleware, UserController.getAllUsers);

// Create user (protected route - admin only)
router.post('/', authMiddleware, UserController.createUser);

// Get user profile (protected route) - must be before /:id route
router.get('/:userId/profile', authMiddleware, UserController.getUserProfile);

// Update user profile (protected route) - must be before /:id route
router.put('/:userId/profile', authMiddleware, UserController.updateUserProfile);

// Get user by ID (protected route)
router.get('/:id', authMiddleware, UserController.getUserById);

// Update user (protected route)
router.put('/:id', authMiddleware, UserController.updateUser);

// Delete user (protected route - admin only)
router.delete('/:id', authMiddleware, UserController.deleteUser);

module.exports = router;

