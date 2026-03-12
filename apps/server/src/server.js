/**
 * CONSOLIDATED PRODUCTION SERVER
 * 
 * NOTES:
 * 1) Make sure you set NODE_ENV=production on Hostinger
 * 2) Make sure JWT_SECRET is set in .env / hosting env vars
 * 3) DB_HOST, DB_USER, DB_NAME required for database connection
 * 4) Authentication via JWT header (Authorization: Bearer <token>)
 * 5) CORS configured for both www and non-www variants of production domain
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// ✅ DATABASE
const db = require('./config/db');

// ✅ IMPORTS
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

if (!process.env.NODE_ENV) {
  console.warn("⚠ WARNING: NODE_ENV not set. Defaulting to development.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '4h';

// ==========================================
// 1) APP INIT & PROXY TRUST
// ==========================================
const app = express();

// Trust Hostinger/proxy for secure connections
app.set('trust proxy', 1);

// ⚠️ HTTPS REDIRECT COMMENTED OUT - May interfere with CORS preflight (OPTIONS) requests
// Behind Hostinger proxy, HTTPS is already enforced. Enabling this can cause CORS failures.
// Uncomment only if needed for non-proxy environments.
/*
if (isProd) {
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}
*/

// ==========================================
// 2) CORS CONFIGURATION (PRODUCTION-SAFE)
// ==========================================
const corsOptions = isProd
  ? {
      // Production: Allow frontend domains (www + non-www)
      origin: [
        'https://croupiertraining.sgwebworks.com',
        'https://www.croupiertraining.sgwebworks.com'
      ],
      credentials: false,      // No cookies; JWT header auth only
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      preflightContinue: false,
      optionsSuccessStatus: 200
    }
  : {
      // Development: Allow localhost + staging origins
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const devAllow = [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://mediumpurple-turtle-960137.hostingersite.com',
          'https://www.mediumpurple-turtle-960137.hostingersite.com',
          'https://croupiertraining.sgwebworks.com',
          'https://www.croupiertraining.sgwebworks.com'
        ];
        if (devAllow.includes(origin)) return callback(null, true);
        console.warn(`⚠️ CORS blocked for origin: ${origin}`);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      preflightContinue: false,
      optionsSuccessStatus: 200
    };

app.use(cors(corsOptions));

// ==========================================
// 3) MIDDLEWARE
// ==========================================
// JWT expected in Authorization header; no cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Dependency Injection
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ==========================================
// 4) ROUTE REGISTRATION
// ==========================================
app.use('/api/enroll', enrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// ==========================================
// 5) AUTH ENDPOINTS
// ==========================================

/**
 * ✅ WHO AM I
 * GET /api/me
 */
app.get('/api/me', (req, res) => {
  // JWT is required in Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
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
  // No cookies to clear; client removes token locally
  return res.status(200).json({ message: 'Logged out' });
});

// ==========================================
// 6) SECURE FILE SERVING
// ==========================================
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
// 7) HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    env: NODE_ENV,
    time: new Date().toISOString(),
    db: db.dbHealthy ? 'connected' : 'error'
  });
});

// ==========================================
// 8) START SERVER
// ==========================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n⭐⭐⭐ SERVER RUNNING ON PORT ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}] ⭐⭐⭐`);
  console.log('✅ Active Routes: /api/health, /api/me, /api/logout, /api/admin/login, /api/admin, /api/student, /api/enroll');
  console.log(`✅ CORS Enabled for: ${isProd ? 'Production domain (www + non-www)' : 'Development origins'}`);
});