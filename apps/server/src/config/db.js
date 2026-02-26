const mysql = require('mysql2/promise'); // ✅ Must use 'promise'
require('dotenv').config();

// Create the Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  // support both DB_PASSWORD and legacy DB_PASS
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ attach the flag directly on the pool
pool.dbHealthy = false;

// Test connection (non-fatal if it fails)
pool.getConnection()
  .then((conn) => {
    console.log('✅ Database Pool Connected Successfully');
    pool.dbHealthy = true; // ✅ update the pool flag (not a local variable)
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Database Connection Failed:', err);
    pool.dbHealthy = false; // ✅ update the poolflag
  });

module.exports = pool; // ✅ Export the POOL directly