// The base URL for your Node.js backend
const API_BASE_URL = 'http://localhost:3001';

/**
 * A helper function to handle API requests.
 * @param {string} endpoint The API route to call (e.g., '/login')
 * @param {object} options The options for the fetch call (method, headers, body)
 * @returns {Promise<any>} The JSON response from the server
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            // If the server responds with an error status (4xx, 5xx)
            const errorData = await response.json();
            throw new Error(errorData.message || 'An API error occurred');
        }

        return response.json();
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        // Re-throw the error so the calling function can handle it
        throw error;
    }
}

/**
 * A helper function for POST requests sending JSON data.
 * @param {string} endpoint The API route (e.g., '/login')
 * @param {object} data The JavaScript object to send as JSON
 * @returns {Promise<any>}
 */
async function postRequest(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

/**
 * A helper function for GET requests.
 * @param {string} endpoint The API route (e.g., '/get-user')
 * @returns {Promise<any>}
 */
async function getRequest(endpoint) {
    return apiRequest(endpoint);
}


// --- User Authentication ---

export async function signupUser(email, password) {
    return await postRequest('/signup', { email, password });
}

export async function loginUser(email, password) {
    return await postRequest('/login', { email, password });
}

export async function logoutUser() {
    return await postRequest('/logout', {});
}

export async function checkUserSession() {
    return await getRequest('/get-user');
}


// --- User Data & Progress ---

export async function updateUserDetails(userData) {
    return await postRequest('/update-user', userData);
}

export async function getUserProgress() {
    return await getRequest('/get-progress');
}

export async function saveUserProgress(step) {
    return await postRequest('/save-progress', { step });
}


// --- OTP Functionality ---

export async function sendOTP(email) {
    const result = await postRequest('/send-otp', { email });
    if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
    }
    return result;
}

export async function verifyOTP(email, otp) {
    const result = await postRequest('/verify-otp', { email, otp });
    return result.success;
}