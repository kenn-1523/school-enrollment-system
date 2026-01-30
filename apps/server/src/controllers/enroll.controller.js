// server/src/controllers/enroll.controller.js
const StudentService = require('../services/studentService');

// We need to pass the DB instance to the service, 
// typically you'd export the DB connection from a config file, 
// but for now, we will assume the service is initialized elsewhere or we pass it.
// BETTER APPROACH: Export 'db' from a db.js file. 
// For this step, let's keep it simple and just move the logic.

exports.enrollStudent = async (req, res, db) => {
    const studentService = new StudentService(db); // Initialize Service
    try {
        const files = {
            idFilename: req.files['idFile'] ? req.files['idFile'][0].filename : null,
            birthCertFilename: req.files['birthCertFile'] ? req.files['birthCertFile'][0].filename : null
        };
        
        // Call the Chef (Service)
        const newId = await studentService.createStudent(req.body, files);
        res.status(200).send({ message: "Student Registered", id: newId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: "Email already exists." });
        console.error(err);
        res.status(500).send({ message: "Enrollment failed" });
    }
};