const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');
const db = require('../config/db');

// ✅ HELPER: Safe JSON Parser (Ensure options are array in responses)
function safeJsonParseArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (typeof value === 'object') return Array.isArray(value) ? value : [];
    if (typeof value !== "string") return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// ==========================================
// 1. STUDENT MANAGEMENT
// ==========================================
router.get('/students', authenticateJWT, adminController.getAllStudents);

// ✅ OLD ROUTE (Keep for compatibility)
router.get('/enrolled-progress', authenticateJWT, adminController.getEnrolledModuleProgress);

// ✅ NEW SCORE REPORT ROUTE
router.get('/score-report', authenticateJWT, adminController.getEnrolledScoreReport);

// ✅ Master List of Enrolled Students
router.get('/enrolled', authenticateJWT, adminController.getEnrolledStudents);

router.get('/student/:studentId', authenticateJWT, adminController.getStudentById);

// ==========================================
// 2. STUDENT ACTIONS
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
router.put('/update-profile', authenticateJWT, adminController.updateProfile);

router.get('/secure-file/:filename', authenticateJWT, (req, res) => {
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

router.get('/courses/:id/content', authenticateJWT, adminController.getCourseContent);

router.post('/courses/:id/lessons', authenticateJWT, adminController.addLesson);
router.put('/lessons/:lessonId', authenticateJWT, adminController.updateLesson);
router.delete('/lessons/:lessonId', authenticateJWT, adminController.deleteLesson);

router.put('/courses/:id', authenticateJWT, adminController.updateCourse);
router.delete('/courses/:id', authenticateJWT, adminController.deleteCourse);


// ==========================================
// 5. QUIZ ROUTES
// ==========================================

// ✅ Single Add Quiz (Now returns consistent options array)
router.post('/lessons/:lessonId/quizzes', authenticateJWT, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { question, options, correct_answer } = req.body;

        const optionsString = typeof options === 'string' ? options : JSON.stringify(options); 

        const sql = "INSERT INTO quizzes (lesson_id, question, options, correct_answer) VALUES (?, ?, ?, ?)";
        
        const [result] = await db.query(sql, [lessonId, question, optionsString, correct_answer]);
        
        res.status(200).json({ 
            success: true, 
            message: "Quiz added", 
            quiz: { 
                id: result.insertId, 
                lesson_id: lessonId, 
                question, 
                // ✅ Safe parse here
                options: safeJsonParseArray(optionsString), 
                correct_answer 
            } 
        });
    } catch (err) {
        console.error("Error adding quiz:", err);
        return res.status(500).json({ error: "Database error adding quiz" });
    }
});

// ✅ Bulk Import Quizzes
router.post('/lessons/:lessonId/quizzes/bulk', authenticateJWT, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { quizzes } = req.body; 

        if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
            return res.status(400).json({ error: "Invalid data. Expected an array of quizzes." });
        }

        const values = quizzes.map(q => [
            lessonId,
            q.question,
            typeof q.options === 'string' ? q.options : JSON.stringify(q.options), 
            q.correct_answer
        ]);

        const sql = "INSERT INTO quizzes (lesson_id, question, options, correct_answer) VALUES ?";
        
        const [result] = await db.query(sql, [values]);
        
        res.status(200).json({ success: true, message: `${result.affectedRows} quizzes imported successfully!` });

    } catch (err) {
        console.error("Bulk Import Error:", err);
        return res.status(500).json({ error: "Failed to import quizzes." });
    }
});

// ✅ UPDATE QUIZ (PUT)
router.put('/quizzes/:id', authenticateJWT, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { id } = req.params;
        const { question, options, correct_answer } = req.body;

        const optionsString = typeof options === 'string' ? options : JSON.stringify(options);

        const [result] = await db.query(
            `UPDATE quizzes
             SET question = ?, options = ?, correct_answer = ?
             WHERE id = ?`,
            [question, optionsString, correct_answer, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        return res.json({ success: true, message: 'Quiz updated' });
    } catch (err) {
        console.error('Update quiz error:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
});

// ✅ Delete Quiz
router.delete('/quizzes/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query("DELETE FROM quizzes WHERE id = ?", [id]);
        
        res.json({ success: true, message: "Quiz deleted" });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        return res.status(500).json({ error: "Error deleting quiz" });
    }
});

module.exports = router;