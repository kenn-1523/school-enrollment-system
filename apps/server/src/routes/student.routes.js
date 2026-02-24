const express = require("express");
const router = express.Router();

const studentController = require("../controllers/student.controller");
const {
  authenticateJWT,
  requireStudent,
} = require("../middleware/auth.middleware");

/**
 * =====================================================
 * STUDENT ROUTES
 * =====================================================
 */

/**
 * PUBLIC ROUTE
 * Student Login
 */
router.post("/login", studentController.login);

/**
 * PROTECTED ROUTES (Student Only)
 */

// Dashboard
router.get(
  "/dashboard",
  authenticateJWT,
  requireStudent,
  studentController.getDashboard
);

// Quiz Submission
router.post(
  "/quiz/submit",
  authenticateJWT,
  requireStudent,
  studentController.submitQuiz
);

module.exports = router;