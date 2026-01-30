const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// 1. Student Management
router.get('/students', authenticateJWT, adminController.getAllStudents);
router.get('/student/:studentId', authenticateJWT, adminController.getStudentById);

// 2. Actions
// We reuse the updateStatus controller but pass specific statuses
router.post('/approve', authenticateJWT, (req, res) => {
    req.body.status = 'Approved';
    adminController.updateStatus(req, res);
});
router.post('/reject', authenticateJWT, (req, res) => {
    req.body.status = 'Rejected';
    adminController.updateStatus(req, res);
});
router.post('/restore', authenticateJWT, (req, res) => {
    req.body.status = 'Pending';
    adminController.updateStatus(req, res);
});

// Update admin's own profile (username / password)
router.put('/update-profile', authenticateJWT, adminController.updateProfile);

router.delete('/students/:id', authenticateJWT, adminController.deleteStudent);

// 3. Secure File View (Moved from index.js)
router.get('/secure-file/:filename', authenticateJWT, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send("Access Denied");
    // We need to go up two levels to get to 'server' root from 'src/routes'
    const filePath = path.join(__dirname, '../../secure_uploads', req.params.filename);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send("File not found");
});

module.exports = router;