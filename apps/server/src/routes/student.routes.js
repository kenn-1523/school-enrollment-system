const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const jwt = require('jsonwebtoken');

// 🛡️ AUTH MIDDLEWARE
const authenticateStudent = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not Authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid Token" });
    }
};

// ==========================================
// ✅ ROUTES
// ==========================================

// 1. Login
router.post('/login', studentController.login);

// 2. Dashboard (Fetches content securely)
router.get('/dashboard', authenticateStudent, studentController.getDashboard);

// 3. Quiz Submission (Secure Grading)
router.post('/quiz/submit', authenticateStudent, studentController.submitQuiz);

module.exports = router;