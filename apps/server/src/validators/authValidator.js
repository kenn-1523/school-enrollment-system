// server/validators/authValidator.js
const { z } = require('zod');

// Define the rules
const registerSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username cannot exceed 20 characters" }),
    
  email: z.string()
    .email({ message: "Invalid email address" }),
    
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    // Optional: Add regex if you need strict complexity (e.g., 1 number required)
    // .regex(/[0-9]/, { message: "Password must contain a number" })
});

module.exports = { registerSchema };