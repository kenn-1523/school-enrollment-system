const mysql = require('mysql2');
require('dotenv').config();

// Create the connection instance
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 
});

// Function to trigger the connection
const connectDB = () => {
    db.connect((err) => {
        if (err) {
            console.error('❌ Database connection failed:', err);
            process.exit(1);
        } else {
            console.log('✅ Connected to MariaDB');
        }
    });
};

// Export both the instance and the connector
module.exports = { db, connectDB };