const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import your pieces
const { enrollStudent } = require('../controllers/enroll.controller');
const { validateEnrollment } = require('../validators/enrollment.validator'); // The Bouncer

// Multer Setup (Copy from index.js)
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'secure_uploads/'); },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// THE CLEAN ROUTE DEFINITION
router.post('/', 
    upload.fields([{ name: 'idFile' }, { name: 'birthCertFile' }]), // 1. Handle Files
    validateEnrollment,                                             // 2. The Bouncer (Security)
    (req, res) => enrollStudent(req, res, req.db)                   // 3. The Controller (Manager)
);

module.exports = router;