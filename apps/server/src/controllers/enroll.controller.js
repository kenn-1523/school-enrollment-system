const StudentService = require('../services/studentService');
const db = require('../config/db'); // ✅ Imports the DB Pool

exports.enrollStudent = async (req, res) => {
    const studentService = new StudentService(db);

    try {
        // --- ✅ START: BUNDLE LOGIC ---
        // 1. Get the list of courses the user wants to buy
        // We handle selectedCourses / courses / courseCodes keys to be safe
        let requestedCourses = req.body.selectedCourses || req.body.courses || req.body.courseCodes || [];

        // Ensure it is an array (handle stringified JSON if necessary)
        if (typeof requestedCourses === 'string') {
            try {
                requestedCourses = JSON.parse(requestedCourses);
            } catch (e) {
                requestedCourses = [requestedCourses];
            }
        }

        // Keep the canonical key in sync for the service layer
        req.body.selectedCourses = requestedCourses;
        req.body.courses = requestedCourses;
        req.body.courseCodes = requestedCourses;

        // Define Rules
        const PAID_COURSES = ['G1', 'G2', 'G3', 'G4', 'G5'];
        const FREE_BUNDLE = ['F1', 'C1', 'C2'];

        // 2. Check if they bought at least one paid course
        const hasPaidCourse = requestedCourses.some(code => PAID_COURSES.includes(code));

        if (hasPaidCourse) {
            console.log("🎁 Bonus Bundle Triggered! Adding F1, C1, C2...");

            const finalCourses = [...new Set([...requestedCourses, ...FREE_BUNDLE])];

            // ✅ Update ALL keys (critical)
            req.body.selectedCourses = finalCourses;
            req.body.courses = finalCourses;
            req.body.courseCodes = finalCourses;
        }
        // --- 🏁 END: BUNDLE LOGIC ---

        const files = {
            idFilename: req.files['idFile'] ? req.files['idFile'][0].filename : null,
            birthCertFilename: req.files['birthCertFile'] ? req.files['birthCertFile'][0].filename : null
        };

        const newId = await studentService.createStudent(req.body, files);

        res.status(201).json({
            message: "Student Registered Successfully",
            studentId: newId
        });

    } catch (err) {
        console.error("Enrollment Error:", err);

        if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
            return res.status(409).send({ message: "Email or Username already exists." });
        }

        res.status(500).send({ message: "Enrollment failed" });
    }
};
