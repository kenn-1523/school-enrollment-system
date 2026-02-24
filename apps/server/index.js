/**
 * ✅ Production-grade Express server (Local + Deployment ready)
 *
 * Goals:
 * - Works on localhost (Next on :3000, API on :3001)
 * - Works on production domain(s) with cookies (JWT in httpOnly cookie)
 * - Correct CORS (dynamic, safe)
 * - Correct cookie options for dev vs prod
 * - Clean env validation
 *
 * REQUIRED ENV:
 *   DB_HOST, DB_USER, DB_NAME, JWT_SECRET
 *
 * RECOMMENDED ENV:
 *   NODE_ENV=production   (on deployment)
 *   PORT=3001
 *
 * OPTIONAL:
 *   DB_PASSWORD
 *   DB_PORT
 *   COOKIE_DOMAIN=.croupiertraining.sgwebworks.com   (only if needed)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// ✅ DB POOL
const db = require('./src/config/db');

// ✅ TOOLS
const validate = require('./src/middleware/validateResources');
const { loginSchema } = require('./src/schemas/authSchemas');

// ✅ ROUTES
const enrollRoutes = require('./src/routes/enroll.routes');
const adminRoutes = require('./src/routes/admin.routes');
const studentRoutes = require('./src/routes/student.routes');

// ==========================================
//           ✅ ENV VALIDATION
// ==========================================
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`\n❌ CRITICAL ERROR: Missing env vars: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// ==========================================
//           ✅ APP INIT
// ==========================================
const app = express();

// ==========================================
//           ✅ CORS (SAFE + WORKS EVERYWHERE)
// ==========================================
// Add every frontend origin that will call your API.
// If you use a preview domain, add it here too.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://croupiertraining.sgwebworks.com',
  'https://www.croupiertraining.sgwebworks.com',
  'https://mediumpurple-turtle-960137.hostingersite.com'
];

// Dynamic origin check (best practice for credentials)
app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server calls (no origin) and tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  })
);

// If you ever had preflight issues behind some proxies:
app.options('*', cors());

// ==========================================
//           ✅ MIDDLEWARES
// ==========================================
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ✅ DEPENDENCY INJECTION
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ==========================================
//           ✅ FILE STORAGE
// ==========================================
const uploadDir = path.join(__dirname, 'secure_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ==========================================
//           ✅ CONSTANTS
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '4h';

// Optional: cookie domain (ONLY needed if you want cookie shared across subdomains)
// Example: COOKIE_DOMAIN=.croupiertraining.sgwebworks.com
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

// Cookie options: correct for local vs prod
function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd, // MUST be true in HTTPS production for SameSite=None
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {})
  };
}

// ==========================================
//           ✅ ROUTES (MODULES)
// ==========================================
app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// ==========================================
//           ✅ AUTH & UTILS
// ==========================================

/**
 * ADMIN LOGIN
 * POST /api/admin/login
 *
 * Expects:
 * { username, password }
 *
 * Returns:
 * { success: true, user: { username, isAdmin: true } }
 * Sets httpOnly cookie: token
 */
app.post('/api/admin/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  try {
    const [result] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (!result || result.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const adminUser = result[0];

    // IMPORTANT: adjust column name if your DB uses a different field
    const hash = adminUser.password_hash;

    if (!hash) {
      return res.status(500).json({ success: false, message: 'Admin password hash missing' });
    }

    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { isAdmin: true, admin_id: adminUser.admin_id, username: adminUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, cookieOptions());

    return res.status(200).json({
      success: true,
      user: { username: adminUser.username, isAdmin: true }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

/**
 * LOGOUT
 * POST /api/logout
 * Clears cookie: token
 */
app.post('/api/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      ...cookieOptions(),
      // clearCookie needs same attributes used to set the cookie
      maxAge: undefined
    });

    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(200).json({ message: 'Logged out' });
  }
});

/**
 * CHECK AUTH (ME)
 * GET /api/me
 * Reads JWT from cookie: token
 */
app.get('/api/me', (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.status(200).json({
      user: {
        isAdmin: !!decoded.isAdmin,
        username: decoded.username
      }
    });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

/**
 * SECURE FILE SERVING
 * GET /api/secure-file/:filename
 */
app.get('/api/secure-file/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(uploadDir, filename);

  // prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(403).send('Access Denied');
  }

  if (fs.existsSync(filepath)) {
    return res.sendFile(filepath);
  }

  return res.status(404).send('File not found');
});

// ==========================================
//           ✅ HEALTH CHECK (OPTIONAL)
// ==========================================
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    env: NODE_ENV,
    time: new Date().toISOString()
  });
});

// ==========================================
//           ✅ START SERVER
// ==========================================
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}]`);
  console.log('✅ Active Routes: /api/me, /api/logout, /api/admin/login, /api/admin, /api/student, /api/enroll');
});
