import axios from 'axios';


/**
 * The base URL for the API domain.
 * @constant {string}
 */
const API_DOMAIN = 'https://tr-backend-production.up.railway.app';

/**
 * Fetches employee data by email.
 * @param {string} email - The email of the employee.
 * @returns {Promise<any>} - A promise that resolves to the employee data.
 */
export async function getEmployeeData(email: string): Promise<any> {
    try {
        const response = await axios.get(`${API_DOMAIN}/employees/${encodeURIComponent(email)}`, {
            headers: {
                'Accept': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch employee data');
    }
}

/**
 * Fetches the onboarding status of an employee by email.
 * @param {string} email - The email of the employee.
 * @returns {Promise<boolean>} - A promise that resolves to the onboarding status.
 */
export async function getEmployeeOnboardingStatus(email: string): Promise<boolean> {
    const employeeData = await getEmployeeData(email);
    return employeeData.completed_sign_up_sequence;
}