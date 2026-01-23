// server/src/dtos/studentDTO.js

const studentDTO = (student) => {
    return {
        student_id: student.student_id,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        email: student.email,
        mobile: student.mobile,
        dob: student.dob,
        sex: student.sex,
        
        // ✅ CRITICAL FIX: Ensure Civil Status is included
        civil_status: student.civil_status, 
        
        // Address Fields
        country: student.country,
        region: student.region,
        province: student.province,
        city: student.city,
        zip_code: student.zip_code,

        // Background
        education_level: student.education_level,
        employment_status: student.employment_status,

        // Meta
        application_status: student.application_status,
        created_at: student.created_at,
        
        // Files
        id_file: student.id_file,
        birth_cert_file: student.birth_cert_file
    };
};

module.exports = { studentDTO };