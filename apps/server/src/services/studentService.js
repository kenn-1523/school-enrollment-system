const bcrypt = require('bcrypt');

class StudentService {
    constructor(db) {
        this.db = db;
    }

    // Normalize incoming status values to the DB's canonical application_status values
    normalizeApplicationStatus(status) {
        const raw = String(status || '').trim();
        const upper = raw.toUpperCase();

        // Support UI-friendly synonyms
        if (['APPROVED', 'ENROLLED', 'ENROLL', 'ENROLLMENT', 'ACCEPTED'].includes(upper)) return 'APPROVED';
        if (['REJECTED', 'DECLINED', 'DENIED'].includes(upper)) return 'REJECTED';
        if (['PENDING', 'WAITING'].includes(upper)) return 'PENDING';

        // Fallback to a safe value
        return upper || 'PENDING';
    }

    // ✅ FIXED: Fetches one row per enrollment so we see specific grades/courses
    async getAllStudents(limit, offset) {
        try {
            const safeLimit = Number(limit) || 50;
            const safeOffset = Number(offset) || 0;

            // Count total students (approximate for pagination)
            const [countResult] = await this.db.query("SELECT COUNT(*) as total FROM students");
            const total = countResult[0].total;

            // ✅ THE FIX: Select grade_details and JOIN courses to get titles
            const query = `
                SELECT 
                    s.*, 
                    c.title as course_title,
                    sc.course_code,
                    sc.status as course_status,
                    sc.progress,
                    sc.grade,
                    sc.grade_details,
                    sc.enrolled_at
                FROM students s
                LEFT JOIN student_courses sc ON s.student_id = sc.student_id
                LEFT JOIN courses c ON sc.course_code = c.course_code
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const [rows] = await this.db.query(query, [safeLimit, safeOffset]);

            return {
                students: rows,
                total,
                page: Math.floor(safeOffset / safeLimit) + 1,
                limit: safeLimit
            };

        } catch (error) {
            console.error("❌ Database Error in getAllStudents:", error);
            throw error;
        }
    }

    // ✅ Get Student by ID
    async getStudentById(studentId) {
        try {
            const [rows] = await this.db.query("SELECT * FROM students WHERE student_id = ?", [studentId]);
            if (rows.length === 0) return null;

            const { password_hash, ...student } = rows[0];
            return student;
        } catch (error) {
            console.error("❌ Database Error in getStudentById:", error);
            throw error;
        }
    }

    // ✅ Update Status (NORMALIZED)
    async updateStatus(studentId, status) {
        try {
            const dbStatus = this.normalizeApplicationStatus(status);
            await this.db.query(
                "UPDATE students SET application_status = ? WHERE student_id = ?",
                [dbStatus, studentId]
            );
            return true;
        } catch (error) {
            console.error("❌ Database Error in updateStatus:", error);
            throw error;
        }
    }

    // ✅ Create Student + Courses
    async createStudent(data, files) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const studentQuery = `
                INSERT INTO students (
                    username, password_hash, first_name, last_name, middle_name,
                    email, mobile, dob, sex, civil_status,
                    education_level, employment_status,
                    country, region, province, city, zip_code,
                    entry_date, scholarship_type,
                    id_file, birth_cert_file, application_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            `;

            const studentValues = [
                data.username,
                hashedPassword,
                data.firstName,
                data.lastName,
                data.middleName || null,
                data.email,
                data.mobile,
                data.dob,
                data.sex,
                data.civilStatus,
                data.educationLevel,
                data.employmentStatus,
                data.country,
                data.region,
                data.province || null,
                data.city,
                data.zipCode,
                data.entryDate,
                data.scholarshipType,
                files.idFilename || null,
                files.birthCertFilename || null
            ];

            const [result] = await connection.query(studentQuery, studentValues);
            const newStudentId = result.insertId;

            // ✅ FIX: Accept selectedCourses OR courses OR courseCodes (string/JSON/array)
            let courses = [];
            const rawCourses =
                data.selectedCourses ??
                data.courses ??
                data.courseCodes ??
                data.selected_courses ??
                [];

            try {
                if (Array.isArray(rawCourses)) {
                    courses = rawCourses;
                } else if (typeof rawCourses === 'string' && rawCourses.trim().length > 0) {
                    const trimmed = rawCourses.trim();
                    courses = trimmed.startsWith('[')
                        ? JSON.parse(trimmed)
                        : trimmed.split(',').map(s => s.trim()).filter(Boolean);
                }
            } catch (e) {
                courses = [];
            }

            courses = [...new Set(courses.map(c => String(c).trim()).filter(Boolean))];

            if (courses.length > 0) {
                const courseValues = courses.map(code => [newStudentId, code]);
                await connection.query(
                    `INSERT INTO student_courses (student_id, course_code) VALUES ?`,
                    [courseValues]
                );
            }

            await connection.commit();
            return newStudentId;

        } catch (error) {
            await connection.rollback();
            console.error("❌ DATABASE ERROR During Enrollment:", error.message);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = StudentService;
