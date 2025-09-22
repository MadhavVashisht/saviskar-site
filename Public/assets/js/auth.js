// The base URL for your Node.js OTP server
const API_BASE_URL = 'https://saviskar.co.in';

/**
 * Requests the backend to generate and send an OTP to the user's email.
 * @param {string} email The user's email address.
 * @returns {Promise<{success: boolean, error?: string}>} An object indicating success or failure.
 */
export async function sendOTP(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/send-otp`, { // Removed /api
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send OTP.');
        }
        return { success: true };
    } catch (error) {
        console.error('Error sending OTP:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Sends the user-entered OTP to the backend for verification.
 * @param {string} email The user's email address.
 * @param {string} otp The 6-digit OTP entered by the user.
 * @returns {Promise<boolean>} True if the OTP is valid, otherwise false.
 */
export async function verifyOTP(email, otp) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp`, { // Removed /api
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: otp }),
        });
        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return false;
    }
}

/**
 * Validates password strength on the client-side for instant user feedback.
 * @param {string} password The password to validate.
 * @returns {boolean} True if the password meets the criteria.
 */
export function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}