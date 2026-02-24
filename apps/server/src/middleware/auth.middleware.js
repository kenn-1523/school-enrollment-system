const jwt = require("jsonwebtoken");

/**
 * =====================================================
 * UNIVERSAL AUTH MIDDLEWARE
 * =====================================================
 * Supports:
 * - Authorization: Bearer <token>
 * - Cookies: admin_token, student_token, token
 *
 * Safe:
 * - Never crashes server
 * - Returns clear errors
 * - Validates JWT_SECRET exists
 */

const authenticateJWT = (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ Check Authorization Header first
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2️⃣ Fallback to Cookies (for compatibility)
    if (!token && req.cookies) {
      token =
        req.cookies.admin_token ||
        req.cookies.student_token ||
        req.cookies.token ||
        null;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication required. No token provided.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not defined in environment variables.");
      return res.status(500).json({
        message: "Server configuration error (JWT secret missing).",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
      reason:
        process.env.NODE_ENV !== "production"
          ? error.message
          : undefined,
    });
  }
};

/**
 * =====================================================
 * ROLE GUARDS
 * =====================================================
 */

const requireAdmin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }

  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      message: "Access denied. Student privileges required.",
    });
  }
  next();
};

module.exports = {
  authenticateJWT,
  requireAdmin,
  requireStudent,
};