require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

// ✅ ENVIRONMENT CHECK
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.error(`\n❌ CRITICAL ERROR: Missing env vars: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// 1. Connect to Database
connectDB();

// 2. Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
});