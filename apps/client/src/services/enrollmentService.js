import axios from 'axios';

// Best Practice: Use Environment Variable, fallback to localhost for now
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/enroll';

export const submitEnrollment = async (formData, idFile, birthCertFile) => {
    try {
        const payload = new FormData();

        // 1. Pack standard text fields
        Object.keys(formData).forEach(key => {
            // Skip files and special arrays to handle them manually below
            if (key !== 'idFile' && key !== 'birthCertFile') {
                if (key === 'selectedCourses') {
                    payload.append(key, JSON.stringify(formData[key]));
                } else {
                    payload.append(key, formData[key]);
                }
            }
        });

        // 2. Pack files
        if (idFile) payload.append('idFile', idFile);
        if (birthCertFile) payload.append('birthCertFile', birthCertFile);

        // 3. Send
        const response = await axios.post(API_URL, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
        });

        return response.data;

    } catch (error) {
        console.error("Enrollment submission failed:", error);
        throw error;
    }
};
