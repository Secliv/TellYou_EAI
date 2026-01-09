const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Register new user (public route)
router.post('/register', AuthController.register);

// Login user (public route)
router.post('/login', AuthController.login);

module.exports = router;

