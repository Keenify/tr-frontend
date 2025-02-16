/**
 * Accountability Matrix Service Module
 * 
 * This module provides a comprehensive set of functions for managing accountability matrix
 * in a company context. It includes functionality for creating, reading, updating,
 * and deleting accountability tasks.
 * 
 * @module AccountabilityService
 */

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Represents the payload required to create a new accountability task
 */
export interface CreateAccountabilityPayload {
    task: string;
    accountable_person: string;
    team_involved: string[];
    dependency: string;
    frequency: string;
}

/**
 * Represents an accountability task as stored in the system
 */
export interface AccountabilityData {
    id: string;
    task: string;
    accountable_person: string;
    team_involved: string[];
    dependency: string;
    frequency: string;
    company_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

/**
 * Represents the payload for updating an existing accountability task
 * All fields are optional, allowing partial updates
 */
export interface UpdateAccountabilityPayload {
    task?: string;
    accountable_person?: string;
    team_involved?: string[];
    dependency?: string;
    frequency?: string;
}

/**
 * Creates a new accountability task
 * @param {string} companyId - The ID of the company
 * @param {string} createdBy - The ID of the user creating the task
 * @param {CreateAccountabilityPayload} payload - The accountability task data to create
 * @returns {Promise<AccountabilityData>} - A promise that resolves to the created accountability task data
 */
export async function createAccountability(
    companyId: string,
    createdBy: string,
    payload: CreateAccountabilityPayload
): Promise<AccountabilityData> {
    const endpoint = `${API_DOMAIN}/accountability-matrix/?company_id=${encodeURIComponent(companyId)}&created_by=${encodeURIComponent(createdBy)}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create accountability task');
    }

    return data as AccountabilityData;
}

/**
 * Fetches all accountability tasks for a specific company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<AccountabilityData[]>} - A promise that resolves to an array of accountability tasks
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getCompanyAccountabilities(
    companyId: string
): Promise<AccountabilityData[]> {
    if (!companyId) {
        throw new Error('Company ID is required');
    }

    const endpoint = `${API_DOMAIN}/accountability-matrix/company/${encodeURIComponent(companyId)}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API request failed:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            throw new Error(errorData.message || 'Failed to fetch company accountabilities');
        }

        const data = await response.json();
        return data as AccountabilityData[];
    } catch (error) {
        console.error('Accountability fetch error:', error);
        throw error;
    }
}

/**
 * Fetches a specific accountability task by ID
 * @param {string} taskId - The ID of the accountability task
 * @param {string} companyId - The ID of the company
 * @returns {Promise<AccountabilityData>} - A promise that resolves to the accountability task data
 */
export async function getAccountability(
    taskId: string,
    companyId: string
): Promise<AccountabilityData> {
    const endpoint = `${API_DOMAIN}/accountability-matrix/${encodeURIComponent(taskId)}?company_id=${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch accountability task');
    }

    return data as AccountabilityData;
}

/**
 * Updates an existing accountability task
 * @param {string} taskId - The ID of the accountability task to update
 * @param {string} companyId - The ID of the company
 * @param {UpdateAccountabilityPayload} payload - The accountability task data to update
 * @returns {Promise<AccountabilityData>} - A promise that resolves to the updated accountability task data
 */
export async function updateAccountability(
    taskId: string,
    companyId: string,
    payload: UpdateAccountabilityPayload
): Promise<AccountabilityData> {
    const endpoint = `${API_DOMAIN}/accountability-matrix/${encodeURIComponent(taskId)}?company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update accountability task');
    }

    return data as AccountabilityData;
}

/**
 * Deletes an accountability task
 * @param {string} taskId - The ID of the accountability task to delete
 * @param {string} companyId - The ID of the company
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
 * @throws {Error} - If the task is not found or deletion fails
 */
export async function deleteAccountability(
    taskId: string,
    companyId: string
): Promise<boolean> {
    const endpoint = `${API_DOMAIN}/accountability-matrix/${encodeURIComponent(taskId)}?company_id=${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
        });
        if (response.status === 404) {
            throw new Error('Accountability task not found');
        }
        throw new Error('Failed to delete accountability task');
    }

    return true;
}
