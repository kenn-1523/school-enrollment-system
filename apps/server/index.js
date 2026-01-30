require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); 

// ✅ TOOLS
const validate = require('./src/middleware/validateResources');
const { loginSchema } = require('./src/schemas/authSchemas'); 

// ✅ ROUTES
const enrollRoutes = require('./src/routes/enroll.routes');
const adminRoutes = require('./src/routes/admin.routes'); // <--- NEW!

// ✅ ENVIRONMENT CHECK
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
    console.error(`\n❌ CRITICAL ERROR: Missing env vars: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();

// ✅ CORS (Preserved)
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

// 🔒 SECURITY HEADERS
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// ✅ DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 
});

db.connect((err) => {
    if (err) console.error('❌ Database connection failed:', err);
    else console.log('✅ Connected to MariaDB');
});

// ✅ DEPENDENCY INJECTION (Critical for your new Controllers)
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ✅ FILE STORAGE SETUP
const uploadDir = path.join(__dirname, 'secure_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


// ==========================================
//           ⚡️ THE NEW CLEAN ROUTES
// ==========================================

// 1. ENROLLMENT (Public)
app.use('/api/enroll', enrollRoutes);

// 2. ADMIN PANEL (Protected)
// All logic for students, approvals, and files is now inside this file!
app.use('/api/admin', adminRoutes);


// ==========================================
//           🔐 AUTH & LOGIN (Keep Here)
// ==========================================
// We keep Login here for now to ensure stability.

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '4h';

// LOGIN
app.post('/api/admin/login', validate(loginSchema), (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM admins WHERE username = ?", [username], async (err, result) => {
        if (err) return res.status(500).json({ message: "Database Error" });
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
    });
});

// LOGOUT
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// CHECK AUTH (ME)
app.get('/api/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).send({ message: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) return res.status(200).send({ user: { isAdmin: true, username: decoded.username } });
        return res.status(403).send({ message: 'Access Denied' });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

// ADMIN SETUP (Delete after use)
app.get('/api/setup-admin', async (req, res) => {
    const username = "admin"; 
    const password = "admin123"; 
    const hash = await bcrypt.hash(password, 10);
    db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash], (err) => {
        if(err) return res.json({ error: err.message });
        res.json({ message: "Admin Created!" });
    });
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`🚀 Server running on Port ${process.env.PORT || 3001}`);
});