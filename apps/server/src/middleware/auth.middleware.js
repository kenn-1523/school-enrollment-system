const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  try {
    // ✅ Prefer admin_token, then student_token, then legacy token
    const cookieToken =
      (req.cookies &&
        (req.cookies.admin_token || req.cookies.student_token || req.cookies.token)) ||
      null;

    // ✅ Optional Authorization: Bearer <token>
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT auth error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authenticateJWT };
