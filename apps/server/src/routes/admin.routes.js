const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const db = require('../config/db'); // ✅ Imports the Promise Pool

// ==========================================
// 1. STUDENT MANAGEMENT
// ==========================================
router.get('/students', authenticateJWT, adminController.getAllStudents);
router.get('/enrolled-progress', authenticateJWT, adminController.getEnrolledModuleProgress);

// ✅ Master List of Enrolled Students
router.get('/enrolled', authenticateJWT, adminController.getEnrolledStudents);

router.get('/student/:studentId', authenticateJWT, adminController.getStudentById);

// ==========================================
// 2. STUDENT ACTIONS (Approve/Reject/Restore)
// ==========================================
router.put('/approve', authenticateJWT, (req, res) => {
    req.body.status = 'APPROVED';
    adminController.updateStatus(req, res);
});

router.put('/reject', authenticateJWT, (req, res) => {
    req.body.status = 'REJECTED';
    adminController.updateStatus(req, res);
});

router.put('/restore', authenticateJWT, (req, res) => {
    req.body.status = 'PENDING';
    adminController.updateStatus(req, res);
});

router.delete('/students/:id', authenticateJWT, adminController.deleteStudent);

// ==========================================
// 3. ADMIN PROFILE & SECURE FILES
// ==========================================

// Update admin's own profile
router.put('/update-profile', authenticateJWT, adminController.updateProfile);

// Secure File View
router.get('/secure-file/:filename', authenticateJWT, (req, res) => {
    // Safety check: ensure req.user exists before checking isAdmin
    if (!req.user?.isAdmin) return res.status(403).send("Access Denied");
    
    const filePath = path.join(__dirname, '../../secure_uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

// ==========================================
// 4. COURSE MANAGEMENT
// ==========================================
router.get('/courses', authenticateJWT, adminController.getCourses);
router.post('/courses', authenticateJWT, adminController.createCourse);

// --------------------------------------------------------
// ✅ MISSING ROUTES ADDED HERE (Fixes your 404 Error)
// --------------------------------------------------------
// Get Lessons & Quizzes for a specific course
router.get('/courses/:id/content', authenticateJWT, adminController.getCourseContent);

// Add, Update, Delete Lessons
router.post('/courses/:id/lessons', authenticateJWT, adminController.addLesson);
router.put('/lessons/:lessonId', authenticateJWT, adminController.updateLesson);
router.delete('/lessons/:lessonId', authenticateJWT, adminController.deleteLesson);
// --------------------------------------------------------

router.put('/courses/:id', authenticateJWT, adminController.updateCourse);
router.delete('/courses/:id', authenticateJWT, adminController.deleteCourse);


// ==========================================
// 5. QUIZ ROUTES (Fixed: Async/Await for Promise DB)
// ==========================================

// ✅ Single Add Quiz
router.post('/lessons/:lessonId/quizzes', authenticateJWT, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { question, options, correct_answer } = req.body;

        // Convert options array to JSON string for database storage
        const optionsString = typeof options === 'string' ? options : JSON.stringify(options); 

        const sql = "INSERT INTO quizzes (lesson_id, question, options, correct_answer) VALUES (?, ?, ?, ?)";
        
        // ✅ Fixed: Using await instead of callback
        const [result] = await db.query(sql, [lessonId, question, optionsString, correct_answer]);
        
        res.status(200).json({ 
            success: true, 
            message: "Quiz added", 
            quiz: { 
                id: result.insertId, 
                lesson_id: lessonId, 
                question, 
                options: typeof options === 'string' ? JSON.parse(options) : options, 
                correct_answer 
            } 
        });
    } catch (err) {
        console.error("Error adding quiz:", err);
        return res.status(500).json({ error: "Database error adding quiz" });
    }
});

// ✅ Bulk Import Quizzes (JSON File)
router.post('/lessons/:lessonId/quizzes/bulk', authenticateJWT, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { quizzes } = req.body; // Expecting an array of objects

        if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
            return res.status(400).json({ error: "Invalid data. Expected an array of quizzes." });
        }

        // Prepare data for bulk insert
        const values = quizzes.map(q => [
            lessonId,
            q.question,
            typeof q.options === 'string' ? q.options : JSON.stringify(q.options), 
            q.correct_answer
        ]);

        const sql = "INSERT INTO quizzes (lesson_id, question, options, correct_answer) VALUES ?";
        
        // ✅ Fixed: Using await instead of callback
        const [result] = await db.query(sql, [values]);
        
        res.status(200).json({ success: true, message: `${result.affectedRows} quizzes imported successfully!` });

    } catch (err) {
        console.error("Bulk Import Error:", err);
        return res.status(500).json({ error: "Failed to import quizzes." });
    }
});

// ✅ Delete Quiz
router.delete('/quizzes/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ Fixed: Using await instead of callback
        await db.query("DELETE FROM quizzes WHERE id = ?", [id]);
        
        res.json({ success: true, message: "Quiz deleted" });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        return res.status(500).json({ error: "Error deleting quiz" });
    }
});

// ✅ Export MUST be at the very end
module.exports = router;