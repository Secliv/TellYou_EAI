require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigrations() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // Create migrations tracking table
        await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);
        console.log('✅ Migration tracking table ready');

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        console.log('📁 Created migrations directory');
        }

        const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

        if (files.length === 0) {
        console.log('⚠️  No migration files found');
        return;
        }

        console.log(`📄 Found ${files.length} migration file(s)`);

        for (const file of files) {
        // Check if already executed
        const result = await client.query(
            'SELECT * FROM schema_migrations WHERE migration_name = $1',
            [file]
        );

        if (result.rows.length === 0) {
            console.log(`\n🔄 Running migration: ${file}`);
            
            const sql = fs.readFileSync(
            path.join(migrationsDir, file),
            'utf8'
            );
            
            await client.query(sql);
            
            await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
            [file]
            );
            
            console.log(`✅ Completed: ${file}`);
        } else {
            console.log(`⏭️  Skipping (already executed): ${file}`);
        }
        }

        console.log('\n🎉 All migrations completed successfully');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

runMigrations();