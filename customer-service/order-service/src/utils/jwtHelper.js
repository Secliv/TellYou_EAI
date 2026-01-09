require('dotenv').config();
const jwt = require('jsonwebtoken');

// JWT Secret should be shared across all services
// Default to environment variable or a shared secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-should-be-changed-in-production';

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload (user data)
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    if (!cleanToken) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else {
      throw new Error(error.message || 'Token verification failed');
    }
  }
}

/**
 * Get user from request headers (for GraphQL context)
 * @param {object} req - Express request object
 * @returns {object|null} Decoded user object or null if no valid token
 */
function getUserFromRequest(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    return verifyToken(authHeader);
  } catch (error) {
    return null;
  }
}

module.exports = {
  verifyToken,
  getUserFromRequest,
  JWT_SECRET,
};

