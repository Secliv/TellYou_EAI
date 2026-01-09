const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      console.log(`Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✓ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`✗ Error running migration ${file}:`, error.message);
      // Continue with next migration even if one fails
      // In production, you might want to stop here
    }
  }

  console.log('All migrations completed');
  await pool.end();
}

runMigrations().catch(console.error);

