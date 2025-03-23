import { CoreValueData, CreateCoreValuePayload, UpdateCoreValuePayload } from '../types/coreValue';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new company core value
 * @param {CreateCoreValuePayload} payload - The core value data to create
 * @returns {Promise<CoreValueData>} - A promise that resolves to the created core value data
 */
export async function createCoreValue(payload: CreateCoreValuePayload): Promise<CoreValueData> {
    const endpoint = `${API_DOMAIN}/company-core-values/`;

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
        throw new Error('Failed to create company core value');
    }

    return data as CoreValueData;
}

/**
 * Fetches a specific core value by ID
 * @param {string} coreValueId - The ID of the core value
 * @returns {Promise<CoreValueData>} - A promise that resolves to the core value data
 */
export async function getCoreValue(coreValueId: string): Promise<CoreValueData> {
    const endpoint = `${API_DOMAIN}/company-core-values/${encodeURIComponent(coreValueId)}`;

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
        throw new Error('Failed to fetch core value');
    }

    return data as CoreValueData;
}

/**
 * Updates a specific core value by ID
 * @param {string} coreValueId - The ID of the core value to update
 * @param {UpdateCoreValuePayload} payload - The core value data to update (can be partial)
 * @returns {Promise<CoreValueData>} - A promise that resolves to the updated core value data
 */
export async function updateCoreValue(
    coreValueId: string,
    payload: UpdateCoreValuePayload
): Promise<CoreValueData> {
    const endpoint = `${API_DOMAIN}/company-core-values/${encodeURIComponent(coreValueId)}`;

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
        throw new Error('Failed to update core value');
    }

    return data as CoreValueData;
}

/**
 * Fetches all core values for a specific company
 * @param {string} companyId - The ID of the company
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<CoreValueData[]>} - A promise that resolves to an array of core value data
 */
export async function getCompanyCoreValues(
    companyId: string,
    skip: number = 0,
    limit: number = 100
): Promise<CoreValueData[]> {
    const endpoint = `${API_DOMAIN}/company-core-values/company/${encodeURIComponent(companyId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch company core values');
    }

    return data as CoreValueData[];
}

/**
 * Deletes a specific core value by ID
 * @param {string} coreValueId - The ID of the core value to delete
 * @returns {Promise<CoreValueData>} - A promise that resolves to the deleted core value data
 */
export async function deleteCoreValue(coreValueId: string): Promise<CoreValueData> {
    const endpoint = `${API_DOMAIN}/company-core-values/${encodeURIComponent(coreValueId)}`;

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
        throw new Error('Failed to delete core value');
    }

    return data as CoreValueData;
}
