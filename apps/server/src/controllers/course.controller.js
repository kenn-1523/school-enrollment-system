const StudentService = require('../services/studentService');
const { studentDTO } = require('../dtos/studentDTO');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper to init service
const getService = (req) => new StudentService(req.db);

// --- ✅ FIX 1: GET APPLICATIONS (PENDING) ---
exports.getAllStudents = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    try {
        console.log("Fetching Pending Applications...");

        const sql = `
            SELECT 
                s.student_id,
                s.first_name, 
                s.last_name,
                s.email,
                s.mobile,
                s.application_status,
                s.id_file,
                s.birth_cert_file,
                s.scholarship_type,
                DATE_FORMAT(s.entry_date, '%Y-%m-%d') as start_date,
                GROUP_CONCAT(sc.course_code SEPARATOR ', ') as applied_courses
            FROM students s
            LEFT JOIN student_courses sc ON s.student_id = sc.student_id
            WHERE UPPER(s.application_status) = 'PENDING'
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `;

        const [rows] = await req.db.query(sql);
        console.log(`Found ${rows.length} pending students.`);

        res.json({ data: rows, pagination: { total: rows.length, page: 1, limit: 50 } });

    } catch (err) {
        console.error("Get Applications Error:", err);
        res.status(500).send({ message: "Database Error" });
    }
};

// --- ✅ FIX 2: GET STUDENT DETAILS ---
exports.getStudentById = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const id = req.params.id || req.params.studentId;

        const student = await getService(req).getStudentById(id);

        if (student) {
            const [courses] = await req.db.query(`
                SELECT 
                    sc.course_code, 
                    c.title, 
                    c.description,
                    sc.status, 
                    sc.progress, 
                    sc.grade, 
                    sc.grade_details,
                    sc.enrolled_at
                FROM student_courses sc
                LEFT JOIN courses c ON sc.course_code = c.course_code
                WHERE sc.student_id = ?
                ORDER BY sc.enrolled_at DESC
            `, [student.student_id]);

            const studentData = studentDTO(student);
            studentData.courses = courses || [];

            res.json(studentData);
        } else {
            res.status(404).send({ message: "Not found" });
        }
    } catch (err) {
        console.error("Get Student Error:", err);
        res.status(500).send({ message: "Error" });
    }
};

// --- ✅ FIX 3: DELETE STUDENT ---
exports.deleteStudent = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { id } = req.params;
    try {
        await req.db.query("DELETE FROM student_progress WHERE student_id = ?", [id]);
        await req.db.query("DELETE FROM student_courses WHERE student_id = ?", [id]);

        await req.db.query("DELETE FROM applications WHERE student_id = ?", [id]);

        try { await req.db.query("DELETE FROM enrollments WHERE student_id = ?", [id]); } catch (e) {}

        await req.db.query("DELETE FROM students WHERE student_id = ?", [id]);

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ message: "Error deleting student." });
    }
};

// --- ✅ FIX: STATUS UPDATE NORMALIZATION ---
exports.updateStatus = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    const { studentId, status } = req.body;

    try {
        const raw = String(status || '').trim();
        const upper = raw.toUpperCase();
        const normalized =
            ['APPROVED', 'ENROLLED', 'ACCEPTED'].includes(upper) ? 'APPROVED'
            : ['REJECTED', 'DECLINED', 'DENIED'].includes(upper) ? 'REJECTED'
            : ['PENDING', 'WAITING'].includes(upper) ? 'PENDING'
            : (upper || 'PENDING');

        await getService(req).updateStatus(studentId, normalized);
        res.json({ message: `Student ${normalized}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error" });
    }
};

exports.updateProfile = async (req, res) => {
    if (!req.user || !req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) return res.status(400).send({ message: 'Current password is required' });
    try {
        const [results] = await req.db.query('SELECT * FROM admins WHERE username = ?', [req.user.username]);
        if (!results || results.length === 0) return res.status(404).json({ message: 'Admin not found' });
        const admin = results[0];
        const match = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid current password' });
        const updatedUsername = (newUsername && String(newUsername).trim()) ? String(newUsername).trim() : admin.username;
        let updatedHash = admin.password_hash;
        if (newPassword && String(newPassword).length > 0) {
            updatedHash = await bcrypt.hash(newPassword, 10);
        }
        await req.db.query('UPDATE admins SET username = ?, password_hash = ? WHERE admin_id = ?', [updatedUsername, updatedHash, admin.admin_id]);
        res.json({ success: true, message: 'Profile updated' });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- ✅ FIX 4: GET ENROLLED STUDENTS (APPROVED/ENROLLED) ---
exports.getEnrolledStudents = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    const sql = `
        SELECT 
            s.student_id,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            s.email,
            s.application_status,
            GROUP_CONCAT(DISTINCT c.title SEPARATOR ', ') as enrolled_courses,
            AVG(sc.progress) as average_progress,
            MAX(sc.enrolled_at) as last_enrolled_at
        FROM students s
        LEFT JOIN student_courses sc ON sc.student_id = s.student_id
        LEFT JOIN courses c ON sc.course_code = c.course_code
        WHERE UPPER(s.application_status) IN ('APPROVED', 'ENROLLED')
        GROUP BY s.student_id
        ORDER BY last_enrolled_at DESC, s.created_at DESC
    `;

    try {
        const [results] = await req.db.query(sql);
        res.json({ success: true, students: results });
    } catch (err) {
        console.error("Get Enrolled Error:", err);
        res.status(500).json({ message: "Database Error" });
    }
};

// --- ✅ FIX 5: GET REJECTED STUDENTS ---
exports.getRejectedStudents = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    const sql = `
        SELECT 
            s.student_id,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            s.email,
            s.mobile,
            s.application_status,
            s.id_file,
            s.birth_cert_file,
            s.scholarship_type,
            DATE_FORMAT(s.entry_date, '%Y-%m-%d') as start_date,
            GROUP_CONCAT(sc.course_code SEPARATOR ', ') as applied_courses
        FROM students s
        LEFT JOIN student_courses sc ON s.student_id = sc.student_id
        WHERE UPPER(s.application_status) IN ('REJECTED', 'DECLINED', 'DENIED')
        GROUP BY s.student_id
        ORDER BY s.created_at DESC
    `;

    try {
        const [rows] = await req.db.query(sql);
        res.json({ success: true, students: rows });
    } catch (err) {
        console.error("Get Rejected Error:", err);
        res.status(500).json({ message: "Database Error" });
    }
};

// --- COURSE MANAGEMENT ---
exports.getAllCourses = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const [courses] = await req.db.query("SELECT * FROM courses");
        return res.json({ success: true, courses });
    } catch (error) {
        console.error("Fetch Courses Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

exports.getCourseContent = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { courseCode } = req.params;
    try {
        const [lessons] = await req.db.query(
            "SELECT * FROM lessons WHERE course_code = ? ORDER BY lesson_order ASC",
            [courseCode]
        );
        const lessonsWithQuizzes = await Promise.all(lessons.map(async (lesson) => {
const [quizzes] = await req.db.query(
  "SELECT * FROM quizzes WHERE lesson_id = ?",
  [lesson.id]
);

            return { ...lesson, quizzes };
        }));

        return res.json({ success: true, lessons: lessonsWithQuizzes });
    } catch (error) {
        console.error("Fetch Course Content Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ✅ UPDATE LESSON
exports.updateLesson = async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

  try {
    const { id } = req.params;
    const { course_code, lesson_order, title, duration, time_limit, content, video_url } = req.body;

    await req.db.query(
      `UPDATE lessons
       SET course_code = ?, lesson_order = ?, title = ?, duration = ?, time_limit = ?, content = ?, video_url = ?
       WHERE id = ?`,
      [
        course_code ?? null,
        lesson_order ?? null,
        title ?? null,
        duration ?? null,
        time_limit ?? null,
        content ?? null,
        video_url ?? null,
        id
      ]
    );

    return res.json({ success: true, message: 'Lesson updated' });
  } catch (error) {
    console.error("Update Lesson Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ✅ UPDATE QUIZ
exports.updateQuiz = async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

  try {
    const { id } = req.params;
    const { question, choices, correct_answer } = req.body;

    await req.db.query(
      `UPDATE quizzes
       SET question = ?, choices = ?, correct_answer = ?
       WHERE id = ?`,
      [
        question ?? null,
        JSON.stringify(choices ?? []),
        correct_answer ?? null,
        id
      ]
    );

    return res.json({ success: true, message: 'Quiz updated' });
  } catch (error) {
    console.error("Update Quiz Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
