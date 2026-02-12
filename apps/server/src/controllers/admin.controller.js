console.log("📂 I AM RUNNING FROM THIS PATH:", __filename);
const StudentService = require('../services/studentService');
const { studentDTO } = require('../dtos/studentDTO');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ✅ FIX: Import DB directly

// ✅ HELPER: Safe JSON Parser (Ensures options is always an array)
function safeJsonParseArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    // Handle specific DB driver edge cases where JSON column might be returned as object
    if (typeof value === 'object') return Array.isArray(value) ? value : [];
    if (typeof value !== "string") return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Helper to format and transform student data
const formatStudent = (student) => ({
    student_id: student.student_id,
    username: student.username,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    email: student.email,
    mobile: student.mobile,
    dob: student.dob,
    sex: student.sex,
    civil_status: student.civil_status,
    country: student.country,
    region: student.region,
    province: student.province,
    city: student.city,
    zip_code: student.zip_code,
    education_level: student.education_level,
    employment_status: student.employment_status,
    created_at: student.created_at,
    application_status: student.application_status,
    id_file: student.id_file,
    birth_cert_file: student.birth_cert_file,
    scholarship_type: student.scholarship_type,
    entry_date: student.entry_date
});

// ==========================
// ✅ LOGIN ADMIN
// ==========================
exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [rows] = await db.query(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { isAdmin: true, username: admin.username, admin_id: admin.id },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 14400000
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================
// ✅ GET ALL STUDENTS
// ==========================
exports.getAllStudents = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const [rows] = await db.query(`
            SELECT 
                s.*,
                GROUP_CONCAT(sc.course_code SEPARATOR ',') AS courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `);

        const students = rows.map(student => ({
            ...studentDTO(student),
            courses: student.courses ? student.courses.split(',') : []
        }));

        return res.json({ success: true, students });
    } catch (err) {
        console.error("❌ Error fetching all students:", err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================
// ✅ GET STUDENT BY ID
// ==========================
exports.getStudentById = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const { studentId } = req.params;

        const [rows] = await db.query(`
            SELECT 
                s.*,
                GROUP_CONCAT(sc.course_code SEPARATOR ',') AS courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            WHERE s.student_id = ?
            GROUP BY s.student_id
            LIMIT 1
        `, [studentId]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = rows[0];

        return res.json({
            success: true,
            student: {
                ...studentDTO(student),
                courses: student.courses ? student.courses.split(',') : []
            }
        });
    } catch (err) {
        console.error("❌ Error fetching student by id:", err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================
// ✅ GET PENDING STUDENTS
// ==========================
exports.getPendingStudents = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const [rows] = await db.query(`
            SELECT s.*, 
                   GROUP_CONCAT(sc.course_code SEPARATOR ',') AS courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            WHERE UPPER(s.application_status) = 'PENDING'
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `);

        const students = rows.map(student => ({
            ...studentDTO(student),
            courses: student.courses ? student.courses.split(',') : []
        }));

        res.json({ success: true, students });
    } catch (err) {
        console.error("❌ Error fetching pending students:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================
// ✅ UPDATE STUDENT STATUS
// ==========================
exports.updateStatus = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const studentId = req.body.studentId || req.body.student_id || req.body.id;
        const status = req.body.status;

        if (!studentId || !status) {
            return res.status(400).json({ message: 'studentId and status are required' });
        }

        const [result] = await db.query(
            'UPDATE students SET application_status = ? WHERE student_id = ?',
            [status, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ success: true, message: 'Status updated' });
    } catch (err) {
        console.error("❌ Error updating status:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ✅ DELETE STUDENT
// ==========================
exports.deleteStudent = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const studentId = req.params.id;

        const [result] = await db.query(
            'DELETE FROM students WHERE student_id = ?',
            [studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ success: true, message: "Student deleted" });
    } catch (err) {
        console.error("❌ Error deleting student:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ✅ GET ENROLLED STUDENTS
// ==========================
exports.getEnrolledStudents = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const [rows] = await db.query(`
            SELECT s.*, 
                   GROUP_CONCAT(sc.course_code SEPARATOR ',') AS courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            WHERE UPPER(s.application_status) IN ('APPROVED', 'ENROLLED')
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `);

        const students = rows.map(student => ({
            ...studentDTO(student),
            courses: student.courses ? student.courses.split(',') : []
        }));

        res.json({ success: true, students });
    } catch (err) {
        console.error("❌ Error fetching enrolled students:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ✅ GET REJECTED STUDENTS
// ==========================
exports.getRejectedStudents = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        const [rows] = await db.query(`
            SELECT s.*, 
                   GROUP_CONCAT(sc.course_code SEPARATOR ',') AS courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            WHERE UPPER(s.application_status) = 'REJECTED'
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `);

        const students = rows.map(student => ({
            ...studentDTO(student),
            courses: student.courses ? student.courses.split(',') : []
        }));

        res.json({ success: true, students });
    } catch (err) {
        console.error("❌ Error fetching rejected students:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ✅ NEW: DETAILED SCORE REPORT FOR ADMIN
// ==========================
exports.getEnrolledScoreReport = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins only" });
    }

    // 🔥 ADAPTED QUERY: Using correct columns (student_id, course_code) based on your schema
    const [rows] = await db.query(`
      SELECT
        sc.id AS student_course_id,
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        s.email,
        c.course_code,
        c.title AS course_title,
        sc.grade,                -- e.g. 25/40
        sc.grade_details,        -- Lesson 1: 5/10 | Lesson 2: 8/10 ...
        sc.status,
        sc.progress,
        sc.enrolled_at           -- Used enrolled_at since updated_at wasn't in original schema
      FROM student_courses sc
      JOIN students s ON sc.student_id = s.student_id
      JOIN courses c ON sc.course_code = c.course_code
      WHERE UPPER(s.application_status) IN ('APPROVED', 'ENROLLED')
      ORDER BY sc.enrolled_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Score report error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// (Legacy Module Progress - redirect to Score Report)
exports.getEnrolledModuleProgress = async (req, res) => {
    // Redirect logic could go here, or just keep the old one for safety
    return exports.getEnrolledScoreReport(req, res);
};

// ==========================
// ✅ UPDATE PROFILE
// ==========================
exports.updateProfile = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const { username, password } = req.body;
        const adminId = req.user.admin_id; 
        if (!username) return res.status(400).json({ message: "Username is required" });

        let query = 'UPDATE admins SET username = ?';
        let params = [username];

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query += ', password_hash = ?';
            params.push(hash);
        }
        query += ' WHERE id = ?';
        params.push(adminId);
        await db.query(query, params);
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("❌ Error updating admin profile:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ✅ COURSE MANAGEMENT
// ==========================
exports.getCourses = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const [rows] = await db.query('SELECT * FROM courses ORDER BY course_code ASC');
        res.json({ success: true, courses: rows });
    } catch (err) {
        console.error("❌ Error fetching courses:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createCourse = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const { course_code, title, description, price } = req.body;
        await db.query(
            'INSERT INTO courses (course_code, title, description, price) VALUES (?, ?, ?, ?)',
            [course_code, title, description, price]
        );
        res.json({ success: true, message: "Course created" });
    } catch (err) {
        console.error("❌ Error creating course:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateCourse = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const courseId = req.params.id; 
        const { course_code, title, description, price } = req.body;
        await db.query(
            'UPDATE courses SET course_code = ?, title = ?, description = ?, price = ? WHERE course_code = ?',
            [course_code, title, description, price, courseId]
        );
        res.json({ success: true, message: "Course updated" });
    } catch (err) {
        console.error("❌ Error updating course:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteCourse = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const courseId = req.params.id;
        await db.query('DELETE FROM courses WHERE course_code = ?', [courseId]);
        res.json({ success: true, message: "Course deleted" });
    } catch (err) {
        console.error("❌ Error deleting course:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// ✅ DYNAMIC LESSON CONTENT (With Safe JSON Parsing)
// ==========================================
exports.getCourseContent = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const courseCode = req.params.id;
        const [courseRows] = await db.query('SELECT * FROM courses WHERE course_code = ?', [courseCode]);
        if (courseRows.length === 0) return res.status(404).json({ message: "Course not found" });

        const [lessons] = await db.query('SELECT * FROM lessons WHERE course_code = ? ORDER BY lesson_order ASC', [courseCode]);

        let content = lessons;
        if (lessons.length > 0) {
            const lessonIds = lessons.map(l => l.id);
            const [quizzes] = await db.query('SELECT * FROM quizzes WHERE lesson_id IN (?) ORDER BY id ASC', [lessonIds]);
            
            // ✅ FIX: Parse options safely using helper
            const parsedQuizzes = quizzes.map(q => ({
                ...q,
                options: safeJsonParseArray(q.options)
            }));

            content = lessons.map(lesson => ({
                ...lesson,
                quizzes: parsedQuizzes.filter(q => q.lesson_id === lesson.id)
            }));
        }
        res.json({ success: true, course: courseRows[0], content });
    } catch (err) {
        console.error("❌ Error getting content:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addLesson = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const courseCode = req.params.id;
        const { title, video_url, content, duration, time_limit } = req.body;
        if (!title) return res.status(400).json({ message: "Lesson title is required" });

        const [orderResult] = await db.query(
            'SELECT MAX(lesson_order) as maxOrder FROM lessons WHERE course_code = ?', 
            [courseCode]
        );
        const nextOrder = (orderResult[0].maxOrder || 0) + 1;

        const [result] = await db.query(
            `INSERT INTO lessons (course_code, lesson_order, title, video_url, content, duration, time_limit) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [courseCode, nextOrder, title, video_url || null, content || '', duration || '10 min', time_limit || 10]
        );
        res.json({ success: true, message: "Lesson added", lessonId: result.insertId });
    } catch (err) {
        console.error("❌ Error adding lesson:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateLesson = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const { lessonId } = req.params;
        const { title, video_url, content, duration, time_limit } = req.body;
        await db.query(
            `UPDATE lessons SET title = ?, video_url = ?, content = ?, duration = ?, time_limit = ? WHERE id = ?`,
            [title, video_url, content, duration || '10 min', time_limit || 10, lessonId]
        );
        res.json({ success: true, message: "Lesson updated" });
    } catch (err) {
        console.error("❌ Error updating lesson:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteLesson = async (req, res) => {
    if (!req.user?.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const { lessonId } = req.params;
        await db.query('DELETE FROM quizzes WHERE lesson_id = ?', [lessonId]);
        await db.query('DELETE FROM lessons WHERE id = ?', [lessonId]);
        res.json({ success: true, message: "Lesson deleted" });
    } catch (err) {
        console.error("❌ Error deleting lesson:", err);
        res.status(500).json({ message: "Server error" });
    }
};