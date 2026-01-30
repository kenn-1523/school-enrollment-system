const StudentService = require('../services/studentService');
const { studentDTO } = require('../dtos/studentDTO');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper to init service
const getService = (req) => new StudentService(req.db);

exports.getAllStudents = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
        const { total, rows } = await getService(req).getAllStudents(limit, offset);
        const cleanStudents = rows.map(student => studentDTO(student));
        res.json({ data: cleanStudents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Database Error" });
    }
};

exports.getStudentById = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const student = await getService(req).getStudentById(req.params.studentId);
        if (student) res.json(studentDTO(student));
        else res.status(404).send({ message: "Not found" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error" });
    }
};

exports.updateStatus = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { studentId, status } = req.body; // Expecting status passed from route or body
    try {
        await getService(req).updateStatus(studentId, status);
        res.json({ message: `Student ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error" });
    }
};

exports.deleteStudent = async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        await getService(req).deleteStudent(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error" });
    }
};

// Update admin profile (username and/or password)
exports.updateProfile = async (req, res) => {
    if (!req.user || !req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) return res.status(400).send({ message: 'Current password is required' });

    try {
        // Lookup the admin record by username embedded in the JWT
        req.db.query('SELECT * FROM admins WHERE username = ?', [req.user.username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (!results || results.length === 0) return res.status(404).json({ message: 'Admin not found' });

            const admin = results[0];
            const match = await bcrypt.compare(currentPassword, admin.password_hash);
            if (!match) return res.status(401).json({ message: 'Invalid current password' });

            const updatedUsername = (newUsername && String(newUsername).trim()) ? String(newUsername).trim() : admin.username;
            let updatedHash = admin.password_hash;
            if (newPassword && String(newPassword).length > 0) {
                updatedHash = await bcrypt.hash(newPassword, 10);
            }

            req.db.query('UPDATE admins SET username = ?, password_hash = ? WHERE admin_id = ?', [updatedUsername, updatedHash, admin.admin_id], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Failed to update admin' });
                }

                // Refresh JWT cookie with new username and admin_id
                try {
                    const token = jwt.sign({ isAdmin: true, admin_id: admin.admin_id, username: updatedUsername }, process.env.JWT_SECRET, { expiresIn: '4h' });
                    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 14400000 });
                } catch (cookieErr) {
                    console.error('Failed to sign token', cookieErr);
                }

                res.json({ success: true, message: 'Profile updated' });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};