const bcrypt = require('bcrypt');

class StudentService {
    constructor(db) {
        this.db = db;
    }

    // 1. Enroll (Create Student)
    // ✅ Updated to include Region, Province, Civil Status, Middle Name, Zip Code, etc.
    async createStudent(data, files) {
        const sql = `
            INSERT INTO students 
            (first_name, middle_name, last_name, email, mobile, dob, 
            sex, civil_status, country, region, province, city, zip_code, 
            education_level, employment_status, application_status,
            id_file, birth_cert_file) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
        `;
        
        const values = [
            data.firstName, 
            data.middleName || null,  // Optional
            data.lastName, 
            data.email, 
            data.mobile, 
            data.dob, 
            data.sex, 
            data.civilStatus, 
            data.country, 
            data.region || null,      // ✅ Save Region
            data.province || null,    // ✅ Save Province
            data.city, 
            data.zipCode, 
            data.educationLevel, 
            data.employmentStatus,
            files.idFilename, 
            files.birthCertFilename
        ];

        return new Promise((resolve, reject) => {
            this.db.query(sql, values, (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    }

    // 2. Get All Students (Paginated)
    async getAllStudents(limit, offset) {
        const countSql = "SELECT COUNT(*) as total FROM students";
        // ✅ SELECT * ensures we fetch Region, Province, and all new fields
        const dataSql = "SELECT * FROM students ORDER BY student_id DESC LIMIT ? OFFSET ?";

        return new Promise((resolve, reject) => {
            this.db.query(countSql, (err, countRes) => {
                if (err) return reject(err);
                
                this.db.query(dataSql, [limit, offset], (err, rows) => {
                    if (err) return reject(err);
                    resolve({ total: countRes[0].total, rows });
                });
            });
        });
    }

    // 3. Get Single Student by ID
    async getStudentById(id) {
        return new Promise((resolve, reject) => {
            this.db.query("SELECT * FROM students WHERE student_id = ?", [id], (err, res) => {
                if (err) return reject(err);
                resolve(res[0]);
            });
        });
    }

    // 4. Update Application Status (Approve/Reject/Restore)
    async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            this.db.query("UPDATE students SET application_status = ? WHERE student_id = ?", [status, id], (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    // 5. Delete Student
    async deleteStudent(id) {
        return new Promise((resolve, reject) => {
            this.db.query("DELETE FROM students WHERE student_id = ?", [id], (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }
}

module.exports = StudentService;