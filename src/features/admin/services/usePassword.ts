import { CreatePasswordPayload, PasswordData, UpdatePasswordPayload } from '../types/password';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new password entry for a company
 * @param {CreatePasswordPayload} payload - The password data to create
 * @returns {Promise<PasswordData>} - A promise that resolves to the created password data
 */
export async function createPassword(payload: CreatePasswordPayload): Promise<PasswordData> {
    const endpoint = `${API_DOMAIN}/passwords/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    console.log(JSON.stringify(payload));

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create password');
    }

    return data as PasswordData;
}

/**
 * Fetches passwords for a specific company
 * @param {string} companyId - The ID of the company
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<PasswordData[]>} - A promise that resolves to an array of password data
 */
export async function getCompanyPasswords(
    companyId: string,
    skip: number = 0,
    limit: number = 500
): Promise<PasswordData[]> {
    const endpoint = `${API_DOMAIN}/passwords/?skip=${skip}&limit=${limit}&company_id=${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company passwords');
    }

    return data as PasswordData[];
}

/**
 * Updates an existing password entry
 * @param {string} passwordId - The ID of the password to update
 * @param {UpdatePasswordPayload} payload - The password data to update (partial)
 * @returns {Promise<PasswordData>} - A promise that resolves to the updated password data
 */
export async function updatePassword(
    passwordId: string,
    payload: UpdatePasswordPayload
): Promise<PasswordData> {
    const endpoint = `${API_DOMAIN}/passwords/${encodeURIComponent(passwordId)}`;
    
    console.log('Update password request:', {
        endpoint,
        payload,
    });

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Update password response:', {
        status: response.status,
        data
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update password');
    }

    return data as PasswordData;
}

/**
 * Fetches the decrypted password for a specific password entry
 * @param {string} passwordId - The ID of the password to decrypt
 * @returns {Promise<string>} - A promise that resolves to the decrypted password
 */
export async function getDecryptedPassword(passwordId: string): Promise<string> {
    const endpoint = `${API_DOMAIN}/passwords/${encodeURIComponent(passwordId)}/decrypt`;

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
        throw new Error('Failed to decrypt password');
    }

    return data as string;
}

/**
 * Deletes a password entry
 * @param {string} passwordId - The ID of the password to delete
 * @returns {Promise<PasswordData>} - A promise that resolves to the deleted password data
 */
export async function deletePassword(passwordId: string): Promise<PasswordData> {
    const endpoint = `${API_DOMAIN}/passwords/${encodeURIComponent(passwordId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
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
        throw new Error('Failed to delete password');
    }

    return data as PasswordData;
}
