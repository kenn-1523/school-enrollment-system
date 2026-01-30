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

        // 2. Pack Files (if they exist)
        if (idFile) payload.append('idFile', idFile);
        if (birthCertFile) payload.append('birthCertFile', birthCertFile);

        // 3. Send to Server
        const response = await axios.post(API_URL, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;

    } catch (error) {
        // Return a clean error message to the UI
        const message = error.response?.data?.message || 'Server connection failed.';
        throw new Error(message);
    }
};