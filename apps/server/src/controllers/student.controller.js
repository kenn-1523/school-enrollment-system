const db = require('../config/db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class StudentController {
    
    // ✅ 1. LOGIN
    async login(req, res) {
        const { username, password } = req.body;
        try {
            const [users] = await db.query("SELECT * FROM students WHERE username = ?", [username]);
            if (users.length === 0) return res.status(401).json({ message: "Invalid login credentials." });

            const student = users[0];
            const isMatch = await bcrypt.compare(password, student.password_hash);
            
            if (!isMatch) return res.status(401).json({ message: "Invalid login credentials." });

            const token = jwt.sign(
                { id: student.student_id, username: student.username, role: 'student' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1d' }
            );

            // return token in body; frontend stores in localStorage
            return res.json({
                success: true,
                message: "Login Successful",
                token,
                user: {
                    student_id: student.student_id,
                    username: student.username,
                    first_name: student.first_name,
                    last_name: student.last_name
                }
            });
        } catch (error) {
            console.error("Login Error:", error);
            return res.status(500).json({ message: "Server Error" });
        }
    }

    // ✅ 2. DASHBOARD DATA
    async getDashboard(req, res) {
        try {
            const studentId = req.user.id; 

            // A. Get Student Info
            const [students] = await db.query(
                "SELECT student_id, first_name, last_name, email, application_status FROM students WHERE student_id = ?", 
                [studentId]
            );

            if (students.length === 0) return res.status(404).json({ message: "Student not found" });

            // B. Get Enrolled Courses (With Summary Grade)
            const [enrolledCourses] = await db.query(`
                SELECT 
                    c.*, 
                    sc.enrolled_at,
                    sc.status,
                    sc.progress,
                    sc.grade
                FROM courses c
                JOIN student_courses sc ON c.course_code = sc.course_code
                WHERE sc.student_id = ?
            `, [studentId]);

            // C. FETCH LESSONS & QUIZZES
            const coursesWithContent = await Promise.all(enrolledCourses.map(async (course) => {
                const [lessons] = await db.query(`
                    SELECT * FROM lessons 
                    WHERE course_code = ? 
                    ORDER BY lesson_order ASC
                `, [course.course_code]);

                const lessonsWithQuizzes = await Promise.all(lessons.map(async (lesson) => {
                    const [quizzes] = await db.query(`
                        SELECT id, question, options, points 
                        FROM quizzes 
                        WHERE lesson_id = ?
                    `, [lesson.id]);
                    
                    const parsedQuizzes = quizzes.map(q => {
                        let parsedOptions = q.options;
                        if (typeof q.options === 'string') {
                            try { parsedOptions = JSON.parse(q.options); } 
                            catch (e) { parsedOptions = []; }
                        }
                        return { ...q, options: parsedOptions };
                    });

                    return { ...lesson, lessonNumber: lesson.lesson_order, quizzes: parsedQuizzes };
                }));

                return { ...course, lessons: lessonsWithQuizzes };
            }));

            return res.json({ success: true, student: students[0], courses: coursesWithContent });

        } catch (error) {
            console.error("Dashboard Error:", error);
            return res.status(500).json({ message: "Server Error fetching dashboard" });
        }
    }

    // ✅ 3. SECURE QUIZ SUBMISSION (Updates Grade for Student AND Admin)
    async submitQuiz(req, res) {
        try {
            const { lessonId, answers } = req.body; 
            const studentId = req.user.id;

            if (!lessonId || !answers) {
                return res.status(400).json({ message: "Missing quiz data" });
            }

            // A. Grade CURRENT Quiz
            const [questions] = await db.query(
                "SELECT id, correct_answer, points FROM quizzes WHERE lesson_id = ?",
                [lessonId]
            );

            if (questions.length === 0) {
                return res.status(404).json({ message: "Quiz content not found" });
            }

            let score = 0;
            let currentTotalQuestions = questions.length;
            
            questions.forEach(q => {
                if (answers[q.id] === q.correct_answer) score++;
            });

            // Determine if they passed (for the success message)
            const passedCurrent = score >= Math.ceil(currentTotalQuestions * 0.7);

            // 🔥 FIX: Always set isCompleted to 1 so progress counts, even if they fail.
            const isCompleted = 1;

            // B. Save Progress to History (Upsert)
            await db.query(`
                INSERT INTO student_progress (student_id, lesson_id, is_completed, quiz_score, completed_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE quiz_score = VALUES(quiz_score), is_completed = VALUES(is_completed), completed_at = NOW()
            `, [studentId, lessonId, isCompleted, score]);

            // =========================================================
            // C. CALCULATE COURSE-WIDE GRADES (For Dashboard & Admin)
            // =========================================================
            
            // 1. Find which course this lesson belongs to
            const [lessonRows] = await db.query("SELECT course_code, title FROM lessons WHERE id = ?", [lessonId]);
            
            if (lessonRows.length > 0) {
                const courseCode = lessonRows[0].course_code;

                // 2. Get ALL lessons for this course
                const [allLessons] = await db.query("SELECT id, title FROM lessons WHERE course_code = ? ORDER BY lesson_order ASC", [courseCode]);
                const lessonIds = allLessons.map(l => l.id);

                if (lessonIds.length > 0) {
                    // 3. Get TOTAL Possible Points for whole course
                    const [totalQuestionsResult] = await db.query(`
                        SELECT COUNT(*) as total 
                        FROM quizzes 
                        WHERE lesson_id IN (?)
                    `, [lessonIds]);
                    const courseTotalPoints = totalQuestionsResult[0].total || 1;

                    // 4. Get ALL Progress for this student in this course
                    const [allProgress] = await db.query(`
                        SELECT lesson_id, quiz_score, is_completed 
                        FROM student_progress 
                        WHERE student_id = ? AND lesson_id IN (?)
                    `, [studentId, lessonIds]);

                    // --- STUDENT VIEW: Total Summary (e.g. "25/50") ---
                    const totalEarned = allProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0);
                    const summaryGrade = `${totalEarned}/${courseTotalPoints}`; 
                    
                    // Count how many lessons are marked completed
                    const lessonsCompletedCount = allProgress.filter(p => p.is_completed).length;
                    
                    // Calculate percentage
                    const progressPercent = Math.round((lessonsCompletedCount / allLessons.length) * 100);
                    const status = progressPercent === 100 ? 'Completed' : 'In Progress';

                    // --- ADMIN VIEW: Detailed Breakdown ---
                    let breakdownParts = [];
                    
                    for (const lesson of allLessons) {
                        const prog = allProgress.find(p => p.lesson_id === lesson.id);
                        
                        // Get question count for THIS specific lesson
                        const [lCount] = await db.query("SELECT COUNT(*) as cnt FROM quizzes WHERE lesson_id = ?", [lesson.id]);
                        const qCount = lCount[0].cnt;

                        // Only add to string if it's not "0/0"
                        if (qCount > 0) {
                            if (prog) {
                                breakdownParts.push(`${lesson.title}: ${prog.quiz_score}/${qCount}`);
                            } else {
                                breakdownParts.push(`${lesson.title}: -/${qCount}`);
                            }
                        }
                    }
                    const detailedGradeString = breakdownParts.join(' | ');

                    // 5. UPDATE THE DASHBOARD RECORD (student_courses)
                    await db.query(`
                        UPDATE student_courses 
                        SET grade = ?, grade_details = ?, progress = ?, status = ?
                        WHERE student_id = ? AND course_code = ?
                    `, [summaryGrade, detailedGradeString, progressPercent, status, studentId, courseCode]);
                }
            }

            // D. Return Results
            return res.json({
                success: true,
                passed: passedCurrent,
                score: score,
                total: currentTotalQuestions,
                message: passedCurrent ? "Congratulations! Lesson Passed." : `You scored ${score}/${currentTotalQuestions}.`
            });

        } catch (error) {
            console.error("Quiz Submission Error:", error);
            return res.status(500).json({ message: "Error grading quiz" });
        }
    }
}

module.exports = new StudentController();