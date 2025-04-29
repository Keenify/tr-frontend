// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Define an interface for the user data
export interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    user_id: string;
    completed_sign_up_sequence: boolean;
    profile_pic_url: string;
    company_id: string;
    reports_to: string | null;
    highest_rank: boolean;
    Is_Employed: boolean;
    id: string;
    created_at: string;
}

// Define an interface for updateable user data
export interface UpdateUserData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    user_id: string;
    completed_sign_up_sequence: boolean;
    profile_pic_url: string;
    company_id: string;
    reports_to: string | null;
    highest_rank: boolean;
}

/**
 * Fetches user data by user ID.
 * @param {string} userId - The authentication ID of the user (user_id in the response).
 * @returns {Promise<UserData>} - A promise that resolves to the user data with id being the employee ID.
 */
export async function getUserData(userId: string): Promise<UserData> {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const endpoint = `${API_DOMAIN}/employees/${encodeURIComponent(userId)}`;
    console.log('Fetching user data from endpoint:', endpoint);

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
            data,
            endpoint
        });
        throw new Error('Failed to fetch user data');
    }

    return data as UserData; // Cast the response to UserData
} 

/**
 * Updates user data for a specific user.
 * 
 * @param {string} userId - The ID of the user to update.
 * @param {UpdateUserData} userData - The user data to update.
 * @returns {Promise<UserData>} - A promise that resolves to the updated user data.
 */
export async function updateUserData(userId: string, userData: UpdateUserData): Promise<UserData> {
    const endpoint = `${API_DOMAIN}/employees/${encodeURIComponent(userId)}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error(`Failed to update user data: ${response.statusText}`);
    }

    return data as UserData; // Cast the response to UserData
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

/**
 * Fetches all employees of a company by company ID.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<UserData[]>} - A promise that resolves to an array of user data.
 */
export async function getAllEmployees(companyId: string): Promise<UserData[]> {
    const endpoint = `${API_DOMAIN}/employees/company/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch employees data');
    }

    return data as UserData[]; // Cast the response to an array of UserData
}