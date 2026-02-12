const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); 
require('dotenv').config();

// ✅ IMPORTS (Updated paths for 'src' folder)
const { db } = require('./config/db'); // Import our new DB instance
const validate = require('./middleware/validateResources');
const { loginSchema } = require('./schemas/authSchemas'); 

// ✅ ROUTES
const enrollRoutes = require('./routes/enroll.routes');
const adminRoutes = require('./routes/admin.routes');

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

// 🔒 SECURITY HEADERS
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// ✅ DEPENDENCY INJECTION
// We inject the 'db' from config/db.js into every request
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ✅ FILE STORAGE SETUP
// Adjusted path to go UP one level to root 'server/secure_uploads'
const uploadDir = path.join(__dirname, '../secure_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


// ==========================================
//           ⚡️ ROUTES
// ==========================================

app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);


// ==========================================
//           🔐 AUTH LOGIC
// ==========================================
// (Kept inline as requested to preserve functionality)

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
res.cookie('admin_token', token, {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 4 * 60 * 60 * 1000
});

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