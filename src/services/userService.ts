// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Fetches user data by user ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<any>} - A promise that resolves to the user data.
 */
export async function getUserData(userId: string): Promise<any> {
    const endpoint = `${API_DOMAIN}/employees/${encodeURIComponent(userId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to fetch user data');
    }

    return data;
} 

/**
 * Retrieves the onboarding status of a user.
 * 
 * This function leverages the getUserData function to fetch the user's data
 * and extracts the 'completed_sign_up_sequence' property, which indicates
 * whether the user has completed the onboarding process.
 * 
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating
 * whether the user has completed the onboarding process.
 * @throws {Error} - Throws an error if the user data cannot be fetched.
 */
export async function getUserOnboardingStatus(userId: string): Promise<boolean> {
    const userData = await getUserData(userId);
    return userData.completed_sign_up_sequence;
}

/**
 * Checks if a user exists in the database.
 * 
 * This function utilizes the getUserData function to retrieve user data
 * and determines the existence of the user by checking if the 'id' property
 * is present in the returned data.
 * 
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating
 * whether the user exists in the database.
 * @throws {Error} - Throws an error if the user data cannot be fetched.
 */
export async function doesUserExist(userId: string): Promise<boolean> {
    const userData = await getUserData(userId);
    return userData.id !== null;
}