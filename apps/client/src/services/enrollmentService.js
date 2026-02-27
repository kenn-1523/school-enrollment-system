import { api } from '@/lib/apiClient';

/**
 * ✅ GLOBAL API CONFIGURATION
 * Safely formats the base URL to ensure it always ends with /api
 */
// Use centralized `api` for network calls. Endpoint: POST /enroll

/**
 * 📝 SUBMIT ENROLLMENT
 * Handles the packing of form data and files into a multipart/form-data request.
 */
export const submitEnrollment = async (formData, idFile, birthCertFile) => {
    try {
        const payload = new FormData();

        // 1. Pack standard text fields
        Object.keys(formData).forEach(key => {
            // Skip files to handle them manually below
            if (key !== 'idFile' && key !== 'birthCertFile') {
                // We stringify the selectedCourses array so the backend can parse it as JSON
                if (key === 'selectedCourses') {
                    payload.append(key, JSON.stringify(formData[key]));
                } else {
                    // Handle null or undefined values gracefully
                    payload.append(key, formData[key] !== null ? formData[key] : '');
                }
            }
        });

        // 2. Pack files (ID and Birth Certificate)
        if (idFile) {
            payload.append('idFile', idFile);
        }
        
        if (birthCertFile) {
            payload.append('birthCertFile', birthCertFile);
        }

        // 3. Send the request
        const response = await api.post('/api/enroll', payload, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        // Return the server response (e.g., the enrollment ID)
        return response.data;    
        
    } catch (error) {
        console.error("Enrollment submission failed:", error);
        
        // Extract the specific error message from the backend if it exists
        const errorMessage = error.response?.data?.message || "Server unreachable";
        throw new Error(errorMessage);
    }
};