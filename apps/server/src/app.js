const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); 
require('dotenv').config();

// ✅ IMPORTS
const { db } = require('./config/db'); 
const validate = require('./middleware/validateResources');
const { loginSchema } = require('./schemas/authSchemas'); 

// ✅ ROUTES
const enrollRoutes = require('./routes/enroll.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes'); // Added student routes

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ✅ CORS (Only one config, strictly using the allowlist)
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "https://mediumpurple-turtle-960137.hostingersite.com",
    "https://www.mediumpurple-turtle-960137.hostingersite.com",
    "https://croupiertraining.sgwebworks.com",
    "https://www.croupiertraining.sgwebworks.com"
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

// ✅ DEPENDENCY INJECTION
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ✅ FILE STORAGE SETUP (Production safe path)
const uploadDir = path.join(process.cwd(), "secure_uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ==========================================
//           ⚡️ ROUTES
// ==========================================
app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes); // Mounted student routes

// ==========================================
//           🔐 AUTH LOGIC
// ==========================================
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
            const token = jwt.sign({ isAdmin: true, username: adminUser.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            
            // ✅ Fixed cookie name to 'token' and added environment-aware security
            res.cookie('token', token, {
                httpOnly: true,
                secure: isProd, 
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 4 * 60 * 60 * 1000
            });

            // ✅ Added token in response for frontend localStorage 
            res.status(200).json({ success: true, token, user: { isAdmin: true, username: adminUser.username } });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    });
});

// LOGOUT
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { 
        httpOnly: true, 
        secure: isProd, 
        sameSite: isProd ? 'none' : 'lax' 
    });
    res.json({ message: 'Logged out' });
});

// CHECK AUTH (ME)
app.get('/api/me', (req, res) => {
    // ✅ Support for cookie token OR header authorization
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).send({ message: 'Not authenticated' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) return res.status(200).send({ user: { isAdmin: true, username: decoded.username } });
        return res.status(403).send({ message: 'Access Denied' });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

// ADMIN SETUP
app.get('/api/setup-admin', async (req, res) => {
    const username = "admin"; 
    const password = "admin123"; 
    const hash = await bcrypt.hash(password, 10);
    db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash], (err) => {
        if(err) return res.json({ error: err.message });
        res.json({ message: "Admin Created!" });
    });
});

module.exports = app;