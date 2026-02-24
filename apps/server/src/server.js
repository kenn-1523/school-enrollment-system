/**
 * NOTES:
 * 1) Make sure you set NODE_ENV=production on Hostinger
 * 2) Make sure JWT_SECRET is set in .env / hosting env vars
 * 3) If your admins table primary key is admin_id (most common),
 * this code supports both admin_id and id to avoid mismatch.
 */

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

// ✅ ROUTES
const enrollRoutes = require('./routes/enroll.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes');

// ==========================================
// 0) ENV VALIDATION
// ==========================================
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((k) => !process.env[k]);
if (missingEnvVars.length > 0) {
  console.error(`\n❌ CRITICAL ERROR: Missing env vars: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '4h';

// Optional: if you need cookies shared across subdomains (www and non-www)
// Example: COOKIE_DOMAIN=.croupiertraining.sgwebworks.com
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// ==========================================
// 1) APP INIT
// ==========================================
const app = express();

// ==========================================
// 2) CORS (credentials-safe)
// ==========================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://croupiertraining.sgwebworks.com',
  'https://www.croupiertraining.sgwebworks.com',
  'https://mediumpurple-turtle-960137.hostingersite.com',
  'https://www.mediumpurple-turtle-960137.hostingersite.com'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman/server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked for origin: ${origin}`);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  })
);

// ==========================================
// 3) MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dependency Injection
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ==========================================
// 4) ROUTE REGISTRATION (MODULE ROUTES)
// ==========================================
app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// ==========================================
// 5) COOKIE HELPERS
// ==========================================
function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd, // true on HTTPS prod
    sameSite: isProd ? 'none' : 'lax', // required for cross-site cookies in prod
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {})
  };
}

/**
 * IMPORTANT:
 * We will use ONE cookie name for auth everywhere:
 * token
 */
const AUTH_COOKIE_NAME = 'token';

// ==========================================
// 6) AUTH ENDPOINTS
// ==========================================

/**
 * ✅ ADMIN LOGIN
 * POST /api/admin/login
 * Body: { username, password }
 */
app.post('/api/admin/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const admin = rows[0];

    const passwordHash = admin.password_hash;

    if (!passwordHash) {
      return res.status(500).json({ success: false, message: 'Admin password hash missing' });
    }

    const match = await bcrypt.compare(password, passwordHash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const adminId = admin.admin_id ?? admin.id;

    if (!adminId) {
      return res.status(500).json({ success: false, message: 'Admin id missing (admin_id/id)' });
    }

    const token = jwt.sign(
      {
        isAdmin: true,
        username: admin.username,
        admin_id: adminId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());

    // ✅ ADDED TOKEN IN RESPONSE FOR LOCALSTORAGE AUTH
    return res.status(200).json({
      success: true,
      token, 
      user: { username: admin.username, isAdmin: true, id: adminId }
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * ✅ WHO AM I
 * GET /api/me
 */
app.get('/api/me', (req, res) => {
  // ✅ Support for cookie token OR header authorization
  let token = req.cookies?.[AUTH_COOKIE_NAME] || null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.admin_id || decoded.student_id || decoded.id || null;

    return res.status(200).json({
      user: {
        isAdmin: !!decoded.isAdmin,
        username: decoded.username || null,
        id: userId
      }
    });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

/**
 * ✅ LOGOUT
 * POST /api/logout
 */
app.post('/api/logout', (req, res) => {
  const opts = {
    ...authCookieOptions(),
    maxAge: undefined
  };

  res.clearCookie(AUTH_COOKIE_NAME, opts);
  res.clearCookie('admin_token', opts);
  res.clearCookie('student_token', opts);

  return res.status(200).json({ message: 'Logged out' });
});

// ==========================================
// 7) SECURE FILE SERVING
// ==========================================
// ✅ PRODUCTION SAFE PATH
const uploadDir = path.join(process.cwd(), "secure_uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.get('/api/secure-file/:filename', (req, res) => {
  const { filename } = req.params;

  // Path traversal protection
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return res.status(403).send('Access Denied');
  }

  const filepath = path.join(uploadDir, filename);

  if (fs.existsSync(filepath)) {
    return res.sendFile(filepath);
  }

  return res.status(404).send('File not found');
});

// ==========================================
// 8) HEALTH 
// ==========================================
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    env: NODE_ENV,
    time: new Date().toISOString()
  });
});

// ==========================================
// 9) START SERVER
// ==========================================
// ✅ HOSTINGER SAFE PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n⭐⭐⭐ SERVER RUNNING ON PORT ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}] ⭐⭐⭐`);
  console.log('✅ Active Routes: /api/health, /api/me, /api/logout, /api/admin/login, /api/admin, /api/student, /api/enroll');
});