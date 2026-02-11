const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL is missing!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection (only once)
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL Connected Successfully'))
  .catch(err => console.error('❌ DB Connection Failed:', err.message));

module.exports = pool;
