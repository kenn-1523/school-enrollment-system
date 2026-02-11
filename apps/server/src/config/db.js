const mysql = require('mysql2/promise'); // ✅ Must use 'promise'
require('dotenv').config();

// Create the Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('✅ Database Pool Connected Successfully');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err);
    });

module.exports = pool; // ✅ Export the POOL directly