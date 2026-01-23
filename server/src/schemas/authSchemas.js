const { z } = require('zod');

// 1. Schema for Admin Login
const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
});

// 2. Schema for Student Enrollment
const enrollStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name too short"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name too short"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().regex(/^[0-9]{7,15}$/, "Invalid mobile number"),
    
    // Dates often come as strings from forms; validate they are real dates
    dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date",
    }),

    sex: z.enum(["Male", "Female"]),
    civilStatus: z.string().min(1, "Required"),
    country: z.string().min(1, "Required"),
    region: z.string().min(1, "Required"),
    city: z.string().min(1, "Required"),
    zipCode: z.string().optional(),
    
    educationLevel: z.string().min(1, "Required"),
    employmentStatus: z.string().min(1, "Required"),
    
    // This is optional because you parse it later
    selectedCourses: z.string().optional()
  })
});

module.exports = { loginSchema, enrollStudentSchema };