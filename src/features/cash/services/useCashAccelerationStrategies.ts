import { CompanyData, UpdateCashAccelerationStrategiesPayload } from '../types/cashAcceleration';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Fetches company data including cash acceleration strategies for a specific company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<CompanyData>} - A promise that resolves to the company data.
 */
export async function getCompanyCashAccelerationStrategies(companyId: string): Promise<CompanyData> {
    const endpoint = `${API_DOMAIN}/companies/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company cash acceleration strategies');
    }

    return data as CompanyData;
}

/**
 * Updates the cash acceleration strategies for a specific company.
 * @param {string} companyId - The ID of the company to update.
 * @param {UpdateCashAccelerationStrategiesPayload} payload - The cash acceleration strategies data to update.
 * @returns {Promise<CompanyData>} - A promise that resolves to the updated company data.
 */
export async function updateCompanyCashAccelerationStrategies(
    companyId: string,
    payload: UpdateCashAccelerationStrategiesPayload
): Promise<CompanyData> {
    const endpoint = `${API_DOMAIN}/companies/${encodeURIComponent(companyId)}`;

    console.log('Update company cash acceleration strategies request:', {
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
    console.log('Update company cash acceleration strategies response:', {
        status: response.status,
        data
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update company cash acceleration strategies');
    }

    return data as CompanyData;
}
