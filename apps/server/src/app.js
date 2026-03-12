const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// cookie-parser removed; JWT header auth only
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
// no cookie parser needed

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


// LOGOUT
app.post('/api/logout', (req, res) => {
    // no cookies to clear in header-auth setup
    res.json({ message: 'Logged out' });
});

// CHECK AUTH (ME)
app.get('/api/me', (req, res) => {
    // header-only JWT
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Not authenticated' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) return res.status(200).send({ user: { isAdmin: true, username: decoded.username } });
        return res.status(403).send({ message: 'Access Denied' });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

module.exports = app;