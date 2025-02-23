import { B2BClientData, CreateB2BClientPayload, UpdateB2BClientPayload } from '../types/b2bClient';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Fetches B2B clients for a specific company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<B2BClientData[]>} - A promise that resolves to an array of B2B client data
 */
export async function getCompanyB2BClients(companyId: string): Promise<B2BClientData[]> {
    const endpoint = `${API_DOMAIN}/b2b-clients/company/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company B2B clients');
    }

    return data as B2BClientData[];
}

/**
 * Creates a new B2B client
 * @param {CreateB2BClientPayload} payload - The B2B client data to create
 * @returns {Promise<B2BClientData>} - A promise that resolves to the created B2B client data
 */
export async function createB2BClient(payload: CreateB2BClientPayload): Promise<B2BClientData> {
    const endpoint = `${API_DOMAIN}/b2b-clients/`;

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
        throw new Error('Failed to create B2B client');
    }

    return data as B2BClientData;
}

/**
 * Fetches a specific B2B client by ID
 * @param {string} clientId - The ID of the B2B client
 * @returns {Promise<B2BClientData>} - A promise that resolves to the B2B client data
 */
export async function getB2BClientById(clientId: string): Promise<B2BClientData> {
    const endpoint = `${API_DOMAIN}/b2b-clients/${encodeURIComponent(clientId)}`;

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
        throw new Error('Failed to fetch B2B client');
    }

    return data as B2BClientData;
}

/**
 * Updates an existing B2B client
 * @param {string} clientId - The ID of the B2B client to update
 * @param {UpdateB2BClientPayload} payload - The B2B client data to update
 * @returns {Promise<B2BClientData>} - A promise that resolves to the updated B2B client data
 */
export async function updateB2BClient(
    clientId: string,
    payload: UpdateB2BClientPayload
): Promise<B2BClientData> {
    const endpoint = `${API_DOMAIN}/b2b-clients/${encodeURIComponent(clientId)}`;

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
        throw new Error('Failed to update B2B client');
    }

    return data as B2BClientData;
}

/**
 * Deletes a B2B client
 * @param {string} clientId - The ID of the B2B client to delete
 * @returns {Promise<{ message: string }>} - A promise that resolves to a success message
 */
export async function deleteB2BClient(clientId: string): Promise<{ message: string }> {
    const endpoint = `${API_DOMAIN}/b2b-clients/${encodeURIComponent(clientId)}`;

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
        throw new Error('Failed to delete B2B client');
    }

    return data as { message: string };
}
