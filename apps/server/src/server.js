require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ✅ DATABASE
const db = require('./config/db');

// ✅ VALIDATION
const validate = require('./middleware/validateResources');
const { loginSchema } = require('./schemas/authSchemas');

const app = express();

// ==========================================
// 1. MIDDLEWARE
// ==========================================
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
app.use(express.urlencoded({ extended: true }));

// Dependency Injection
app.use((req, res, next) => {
    req.db = db;
    next();
});

// ==========================================
// 2. REGISTER ROUTES
// ==========================================
const enrollRoutes = require('./routes/enroll.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes'); // ✅ Student Routes

app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes); // ✅ Registered

// ==========================================
// 3. AUTHENTICATION & ADMIN
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '4h';

// Admin Login
app.post('/api/admin/login', validate(loginSchema), async (req, res) => {
    const { username, password } = req.body;
    try {
        const [result] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
        if (result.length === 0) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const match = await bcrypt.compare(password, result[0].password_hash);
        if (match) {
            // ✅ include isAdmin true + admin id
            const token = jwt.sign(
                { isAdmin: true, username, admin_id: result[0].id },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // ✅ IMPORTANT: Admin cookie is now admin_token
            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 14400000
            });

            res.status(200).json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// "Who Am I?"
app.get('/api/me', (req, res) => {
    // ✅ Prefer admin_token, then student_token, then legacy token
    const token =
        (req.cookies && (req.cookies.admin_token || req.cookies.student_token || req.cookies.token)) || null;

    if (!token) return res.status(401).send({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).send({
            user: {
                isAdmin: decoded.isAdmin || false,
                username: decoded.username,
                id: decoded.id || decoded.admin_id
            }
        });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    // ✅ Clear all (admin + student + legacy)
res.clearCookie('admin_token', { httpOnly: true, secure: false, sameSite: 'lax' });
res.clearCookie('student_token', { httpOnly: true, secure: false, sameSite: 'lax' });
res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' }); // legacy cleanup

    res.json({ message: 'Logged out' });
});

// ==========================================
// 4. STATIC FILES
// ==========================================
// Fix path to go UP one level from 'src' to 'secure_uploads'
const uploadDir = path.join(__dirname, '../secure_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Secure File Route
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n⭐⭐⭐ NEW SERVER CODE IS RUNNING ON PORT ${PORT} ⭐⭐⭐`);
    console.log("✅ Active Routes: Student, Admin, Enroll");
});
