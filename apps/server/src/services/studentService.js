// server/src/services/studentService.js
const StudentModel = require('../models/student.model');

class StudentService {
    constructor(db) {
        // Initialize the Model
        this.studentModel = new StudentModel(db);
    }

    // 1. Enroll Student
    async createStudent(data, files) {
        // Business Logic: Check for duplicates first
        const existing = await this.studentModel.findByEmail(data.email);
        if (existing) {
            const error = new Error("Email already exists");
            error.code = 'ER_DUP_ENTRY'; 
            throw error;
        }

        // Call Model to Save
        return await this.studentModel.create(data, files);
    }

    // 2. Get All
    async getAllStudents(limit, offset) {
        return await this.studentModel.findAll(limit, offset);
    }

    // 3. Get Single
    async getStudentById(id) {
        return await this.studentModel.findById(id);
    }

    // 4. Update Status
    async updateStatus(id, status) {
        return await this.studentModel.updateStatus(id, status);
    }

    // 5. Delete
    async deleteStudent(id) {
        return await this.studentModel.delete(id);
    }
}

module.exports = StudentService;