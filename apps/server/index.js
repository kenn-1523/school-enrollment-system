require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); 

// ✅ IMPORT THE POOL
const db = require('./src/config/db');

// ✅ TOOLS
const validate = require('./src/middleware/validateResources');
const { loginSchema } = require('./src/schemas/authSchemas'); 

// ✅ ROUTES
const enrollRoutes = require('./src/routes/enroll.routes');
const adminRoutes = require('./src/routes/admin.routes'); 
const studentRoutes = require('./src/routes/student.routes'); 

// ✅ ENVIRONMENT CHECK
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.error(`\n❌ CRITICAL ERROR: Missing env vars: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();

// ✅ CORS
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "https://mediumpurple-turtle-960137.hostingersite.com",
    "https://www.mediumpurple-turtle-960137.hostingersite.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ DEPENDENCY INJECTION 
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ✅ FILE STORAGE SETUP
// Corrected path: points to apps/server/secure_uploads
const uploadDir = path.join(__dirname, 'secure_uploads'); 
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ==========================================
//           ⚡️ ROUTES
// ==========================================

app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);


// ==========================================
//           🔐 AUTH & UTILS
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '4h';

// ADMIN LOGIN
app.post('/api/admin/login', validate(loginSchema), async (req, res) => {
    const { username, password } = req.body;
    try {
        const [result] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
        if (result.length === 0) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const adminUser = result[0];
        const match = await bcrypt.compare(password, adminUser.password_hash);
        
        if (match) {
            const token = jwt.sign({ isAdmin: true, admin_id: adminUser.admin_id, username: adminUser.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 14400000 });
            res.status(200).json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Database Error" });
    }
});

// LOGOUT
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// SECURE FILE SERVING
app.get('/api/secure-file/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(uploadDir, filename);
    
    if (filename.includes('..')) return res.status(403).send('Access Denied');
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).send('File not found');
    }
});

// CHECK AUTH (ME)
app.get('/api/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).send({ message: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).send({ user: { isAdmin: decoded.isAdmin || false, username: decoded.username } });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log("✅ Active Routes: /api/student/dashboard, /api/admin, /api/enroll");
});