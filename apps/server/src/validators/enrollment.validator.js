// server/src/validators/enrollment.validator.js

const validateEnrollment = (req, res, next) => {
    const { firstName, lastName, email, mobile, dob, entryDate, selectedCourses } = req.body;
    const errors = [];

    // 1. Check Required Fields
    if (!firstName || !lastName || !email || !mobile) {
        errors.push("Missing required personal information.");
    }

    // 2. Strict Age Rule (18 - 90)
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) errors.push("Applicant must be at least 18 years old.");
        if (age > 90) errors.push("Applicant cannot be older than 90 years.");
    } else {
        errors.push("Date of Birth is required.");
    }

    // 3. Strict Future Date Rule
    if (entryDate) {
        const selectedDate = new Date(entryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        if (selectedDate < today) {
            errors.push("Start date cannot be in the past.");
        }
    } else {
        errors.push("Start Date is required.");
    }

    // 4. Course Selection Rule
    let courses = selectedCourses;
    try {
        if (typeof courses === 'string') {
            courses = JSON.parse(courses);
        }
    } catch (e) {
        courses = [];
    }

    if (!Array.isArray(courses) || courses.length === 0) {
        errors.push("At least one course must be selected.");
    }

    // --- DECISION ---
    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: errors[0] 
        });
    }

    next();
};

// ✅ CORRECT EXPORT FOR YOUR PROJECT (CommonJS)
module.exports = { validateEnrollment };