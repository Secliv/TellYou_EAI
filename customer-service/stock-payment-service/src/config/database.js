const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Event listeners
pool.on('connect', () => {
    console.log('🔌 Database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Export both pool and query method
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};