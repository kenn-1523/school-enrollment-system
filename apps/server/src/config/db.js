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
    queueLimit: 0
});

// Track DB health status for health checks
let dbHealthy = false;

// Test connection (non-fatal if it fails)
pool.getConnection()
    .then(conn => {
        console.log('✅ Database Pool Connected Successfully');
        dbHealthy = true;
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err);
        dbHealthy = false;
    });

pool.dbHealthy = dbHealthy; // Attach health status to pool object
module.exports = pool; // ✅ Export the POOL directly