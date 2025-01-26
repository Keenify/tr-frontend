// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Define an interface for the company data
export interface CompanyData {
    name: string;
    completed_sign_up_sequence: boolean;
    company_brand_color: string | null;
    id: string;
    created_at: string;
}

/**
 * Fetches company data by company ID.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<CompanyData>} - A promise that resolves to the company data.
 */
export async function getCompanyData(companyId: string): Promise<CompanyData> {
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
        throw new Error('Failed to fetch company data');
    }

    return data as CompanyData; // Cast the response to CompanyData
} 