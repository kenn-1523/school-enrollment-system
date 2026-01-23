require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt'); 

// ✅ TOOLS
const validate = require('./src/middleware/validateResources');
const { loginSchema, enrollStudentSchema } = require('./src/schemas/authSchemas');
const { studentDTO } = require('./src/dtos/studentDTO'); 

// ✅ SERVICE LAYER
// This imports the logic we moved, keeping this file clean and manageable
const StudentService = require('./src/services/studentService');

// ✅ STEP 5: ENVIRONMENT VALIDATION
// =============================================================
const requiredEnvVars = [
    'DB_HOST', 
    'DB_USER', 
    'DB_NAME', 
    'JWT_SECRET' 
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`\n❌ CRITICAL SECURITY ERROR: Missing environment variables:`);
    missingEnvVars.forEach(key => console.error(`   - ${key}`));
    console.error(`\nServer cannot start. Please check your .env file.\n`);
    process.exit(1); // Kill the server immediately
}
// =============================================================

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "https://your-actual-domain.com", // <--- ADD THIS (Replace with your domain)
    "https://www.your-actual-domain.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 🔒 CRITICAL SECURITY HEADERS
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '4h';

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 
});

db.connect((err) => {
    if (err) console.error('❌ Database connection failed:', err);
    else console.log('✅ Connected to MariaDB');
});

// ✅ INITIALIZE SERVICE
const studentService = new StudentService(db);

// FILE STORAGE CONFIGURATION
const uploadDir = path.join(__dirname, 'secure_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'secure_uploads/'); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// AUTH MIDDLEWARE
function authenticateJWT(req, res, next) {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).send({ message: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
}

// ==========================================
//           ROUTES
// ==========================================

// 1. SMART ENROLL (Uses Service)
app.post('/api/enroll', 
    upload.fields([{ name: 'idFile', maxCount: 1 }, { name: 'birthCertFile', maxCount: 1 }]), 
    validate(enrollStudentSchema), 
    async (req, res) => {
        try {
            const files = {
                idFilename: req.files['idFile'] ? req.files['idFile'][0].filename : null,
                birthCertFilename: req.files['birthCertFile'] ? req.files['birthCertFile'][0].filename : null
            };
            
            // Call the Service logic
            const newId = await studentService.createStudent(req.body, files);
            res.status(200).send({ message: "Student Registered", id: newId });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ message: "Email already exists." });
            console.error(err);
            res.status(500).send({ message: "Enrollment failed" });
        }
    }
);

// 2. ADMIN LOGIN
app.post('/api/admin/login', validate(loginSchema), (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM admins WHERE username = ?", [username], async (err, result) => {
        if (err) return res.status(500).json({ message: "Database Error" });
        if (result.length === 0) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const adminUser = result[0];
        const match = await bcrypt.compare(password, adminUser.password_hash);
        
        if (match) {
            const token = jwt.sign({ isAdmin: true, username: adminUser.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 14400000 });
            res.status(200).json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    });
});

// 3. LOGOUT
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// 4. CHECK AUTH
app.get('/api/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).send({ message: 'Not authenticated' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) return res.status(200).send({ user: { isAdmin: true, username: decoded.username } });
        return res.status(403).send({ message: 'Access Denied' });
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
});

// ✅ SETUP ROUTE (Run once to create admin, then delete)
app.get('/api/setup-admin', async (req, res) => {
    const username = "admin"; 
    const password = "admin123"; 
    const hash = await bcrypt.hash(password, 10);
    db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash], (err) => {
        if(err) return res.json({ error: err.message });
        res.json({ message: "Admin Created! Now delete this route." });
    });
});

// ==========================================
//           ADMIN ROUTES (Using Service)
// ==========================================

// 5. GET ALL STUDENTS (Paginated + DTO)
app.get('/api/admin/students', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    try {
        const { total, rows } = await studentService.getAllStudents(limit, offset);
        const cleanStudents = rows.map(student => studentDTO(student));
        
        res.json({
            data: cleanStudents,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Database Error" });
    }
});

// 6. GET SINGLE STUDENT
app.get('/api/student/:studentId', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        const student = await studentService.getStudentById(req.params.studentId);
        if (student) res.json(studentDTO(student));
        else res.status(404).send({ message: "Not found" });
    } catch (err) { 
        console.error(err);
        res.status(500).send({ message: "Error" }); 
    }
});

// 7. SECURE FILE VIEWING
app.get('/api/secure-file/:filename', authenticateJWT, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send("Access Denied");
    const filePath = path.join(__dirname, 'secure_uploads', req.params.filename);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send("File not found");
});

// 8. APPROVE STUDENT
app.post('/api/admin/approve', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        await studentService.updateStatus(req.body.studentId, 'Approved');
        res.json({ message: "Approved" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Error" }); 
    }
});

// 9. REJECT STUDENT
app.post('/api/admin/reject', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        await studentService.updateStatus(req.body.studentId, 'Rejected');
        res.json({ message: "Rejected" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Error" }); 
    }
});

// 10. RESTORE STUDENT (Used by Restore button)
app.post('/api/admin/restore', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        await studentService.updateStatus(req.body.studentId, 'Pending');
        res.json({ message: "Restored to Pending" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Error" }); 
    }
});

// 11. DELETE STUDENT
app.delete('/api/admin/students/:id', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    try {
        await studentService.deleteStudent(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: "Error" }); 
    }
});

// 12. CHANGE ADMIN PASSWORD
app.put('/api/admin/update-profile', authenticateJWT, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Forbidden' });
    const { currentPassword, newUsername, newPassword } = req.body;
    db.query("SELECT * FROM admins WHERE username = ?", [req.user.username], async (err, result) => {
        if (err || result.length === 0) return res.status(500).json({ message: "Admin not found" });
        const admin = result[0];
        const match = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!match) return res.status(401).json({ message: "Incorrect current password" });

        let finalHash = admin.password_hash;
        if (newPassword) finalHash = await bcrypt.hash(newPassword, 10);
        const finalUser = newUsername || admin.username;

        db.query("UPDATE admins SET username = ?, password_hash = ? WHERE admin_id = ?", [finalUser, finalHash, admin.admin_id], () => {
            res.json({ message: "Profile updated! Log in again." });
        });
    });
});

// START SERVER
app.listen(process.env.PORT || 3001, () => {
    console.log(`🚀 Server running on Port ${process.env.PORT || 3001}`);
});