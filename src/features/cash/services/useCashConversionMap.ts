import React from 'react';
import { CompanyResponse, UpdateCashConversionMapPayload } from '../types/cashConversion';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Fetches company data including cash conversion map for a specific company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<CompanyResponse>} - A promise that resolves to the company data.
 */
export async function getCompanyCashConversionMap(companyId: string): Promise<CompanyResponse> {
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
        throw new Error('Failed to fetch company cash conversion map');
    }

    return data as CompanyResponse;
}

/**
 * Updates the cash conversion map for a specific company.
 * @param {string} companyId - The ID of the company to update.
 * @param {UpdateCashConversionMapPayload} payload - The cash conversion map data to update.
 * @returns {Promise<CompanyResponse>} - A promise that resolves to the updated company data.
 */
export async function updateCompanyCashConversionMap(
    companyId: string,
    payload: UpdateCashConversionMapPayload
): Promise<CompanyResponse> {
    const endpoint = `${API_DOMAIN}/companies/${encodeURIComponent(companyId)}`;

    console.log('Update company cash conversion map request:', {
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
    console.log('Update company cash conversion map response:', {
        status: response.status,
        data
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update company cash conversion map');
    }

    return data as CompanyResponse;
}

/**
 * Custom hook for managing cash conversion map data.
 * @param {string} companyId - The ID of the company.
 * @returns {Object} - Object containing cash conversion map data and functions.
 */
export function useCashConversionMap(companyId: string | undefined) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<CompanyResponse | null>(null);

    const fetchData = React.useCallback(async () => {
        if (!companyId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await getCompanyCashConversionMap(companyId);
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching cash conversion map:', err);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    const updateData = React.useCallback(async (payload: UpdateCashConversionMapPayload) => {
        if (!companyId) return { success: false, error: 'No company ID provided' };

        setLoading(true);
        setError(null);

        try {
            const response = await updateCompanyCashConversionMap(companyId, payload);
            setData(response);
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            console.error('Error updating cash conversion map:', err);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data: data?.cash_conversion_map ?? null,
        loading,
        error,
        refetch: fetchData,
        updateCashConversionMap: updateData,
    };
}

export default useCashConversionMap;
