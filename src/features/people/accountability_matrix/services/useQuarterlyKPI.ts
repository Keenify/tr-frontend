/**
 * Quarterly KPI Service Module
 * 
 * This module provides a comprehensive set of functions for managing quarterly KPIs
 * in a company context. It includes functionality for creating, reading, updating,
 * and deleting KPIs.
 * 
 * @module QuarterlyKPIService
 */

import { 
    CreateKPIPayload, 
    KPIData, 
    UpdateKPIPayload,
    KPITrackingRecord,
    CreateKPITrackingPayload,
    UpdateKPITrackingPayload
} from '../types/quarterlyKPI.types';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new KPI
 * @param {CreateKPIPayload} payload - The KPI data to create, including company_id
 * @returns {Promise<KPIData>} - A promise that resolves to the created KPI data
 */
export async function createKPI(
    payload: CreateKPIPayload
): Promise<KPIData> {
    const endpoint = `${API_DOMAIN}/kpis/`;
    
    // Debug logs
    console.log('Create KPI endpoint:', endpoint);
    console.log('Create KPI payload:', JSON.stringify(payload, null, 2));

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
        throw new Error('Failed to create KPI');
    }
    
    // Log the successful response
    console.log('Create KPI response:', JSON.stringify(data, null, 2));

    return data as KPIData;
}

/**
 * Fetches all KPIs for a specific company
 * @param {string} companyId - The ID of the company
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<KPIData[]>} - A promise that resolves to an array of KPIs
 * @throws {Error} If company ID is missing or API request fails
 */
export async function getCompanyKPIs(
    companyId: string,
    skip: number = 0,
    limit: number = 100
): Promise<KPIData[]> {
    if (!companyId) {
        throw new Error('Company ID is required');
    }

    const endpoint = `${API_DOMAIN}/kpis/company/${encodeURIComponent(companyId)}?skip=${skip}&limit=${limit}`;
    console.log('Fetching KPIs from endpoint:', endpoint);

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
            throw new Error(errorData.message || 'Failed to fetch company KPIs');
        }

        const data = await response.json();
        console.log('KPI data received:', JSON.stringify(data, null, 2));
        return data as KPIData[];
    } catch (error) {
        console.error('KPI fetch error:', error);
        throw error;
    }
}

/**
 * Fetches a specific KPI by ID
 * @param {string} kpiId - The ID of the KPI
 * @returns {Promise<KPIData>} - A promise that resolves to the KPI data
 */
export async function getKPI(kpiId: string): Promise<KPIData> {
    const endpoint = `${API_DOMAIN}/kpis/${encodeURIComponent(kpiId)}`;

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
        throw new Error('Failed to fetch KPI');
    }

    return data as KPIData;
}

/**
 * Updates an existing KPI
 * @param {string} kpiId - The ID of the KPI to update
 * @param {UpdateKPIPayload} payload - The KPI data to update
 * @returns {Promise<KPIData>} - A promise that resolves to the updated KPI data
 */
export async function updateKPI(
    kpiId: string,
    payload: UpdateKPIPayload
): Promise<KPIData> {
    const endpoint = `${API_DOMAIN}/kpis/${encodeURIComponent(kpiId)}`;

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
        throw new Error('Failed to update KPI');
    }

    return data as KPIData;
}

/**
 * Deletes a KPI
 * @param {string} kpiId - The ID of the KPI to delete
 * @returns {Promise<KPIData>} - A promise that resolves to the deleted KPI data
 * @throws {Error} - If the KPI is not found or deletion fails
 */
export async function deleteKPI(kpiId: string): Promise<KPIData> {
    const endpoint = `${API_DOMAIN}/kpis/${encodeURIComponent(kpiId)}`;

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
            throw new Error('KPI not found');
        }
        throw new Error('Failed to delete KPI');
    }
    
    const data = await response.json();
    return data as KPIData;
}

/**
 * Creates a new KPI tracking record
 * @param {CreateKPITrackingPayload} payload - The tracking record data to create
 * @returns {Promise<KPITrackingRecord>} - A promise that resolves to the created tracking record
 */
export async function createKPITracking(
    payload: CreateKPITrackingPayload
): Promise<KPITrackingRecord> {
    const endpoint = `${API_DOMAIN}/kpis/tracking`;

    // Debug logs
    console.log('Create KPI tracking endpoint:', endpoint);
    console.log('Create KPI tracking payload:', JSON.stringify(payload, null, 2));

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
        throw new Error('Failed to create KPI tracking record');
    }

    // Log the successful response
    console.log('Create KPI tracking response:', JSON.stringify(data, null, 2));

    return data as KPITrackingRecord;
}

/**
 * Fetches a specific KPI tracking record by ID
 * @param {string} trackingId - The ID of the tracking record
 * @returns {Promise<KPITrackingRecord>} - A promise that resolves to the tracking record data
 */
export async function getKPITracking(trackingId: string): Promise<KPITrackingRecord> {
    const endpoint = `${API_DOMAIN}/kpis/tracking/${encodeURIComponent(trackingId)}`;

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
        throw new Error('Failed to fetch KPI tracking record');
    }

    return data as KPITrackingRecord;
}

/**
 * Updates an existing KPI tracking record
 * @param {string} trackingId - The ID of the tracking record to update
 * @param {UpdateKPITrackingPayload} payload - The tracking record data to update
 * @returns {Promise<KPITrackingRecord>} - A promise that resolves to the updated tracking record
 */
export async function updateKPITracking(
    trackingId: string,
    payload: UpdateKPITrackingPayload
): Promise<KPITrackingRecord> {
    const endpoint = `${API_DOMAIN}/kpis/tracking/${encodeURIComponent(trackingId)}`;

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
        throw new Error('Failed to update KPI tracking record');
    }

    return data as KPITrackingRecord;
}

/**
 * Fetches all tracking records for a specific KPI
 * @param {string} kpiId - The ID of the KPI
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<KPITrackingRecord[]>} - A promise that resolves to an array of tracking records
 */
export async function getTrackingsByKPI(
    kpiId: string,
    skip: number = 0,
    limit: number = 100
): Promise<KPITrackingRecord[]> {
    const endpoint = `${API_DOMAIN}/kpis/tracking/kpi/${encodeURIComponent(kpiId)}?skip=${skip}&limit=${limit}`;

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
            throw new Error(errorData.message || 'Failed to fetch KPI tracking records');
        }

        const data = await response.json();
        return data as KPITrackingRecord[];
    } catch (error) {
        console.error('KPI tracking fetch error:', error);
        throw error;
    }
}

/**
 * Fetches all tracking records for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<KPITrackingRecord[]>} - A promise that resolves to an array of tracking records
 */
export async function getTrackingsByEmployee(
    employeeId: string,
    skip: number = 0,
    limit: number = 100
): Promise<KPITrackingRecord[]> {
    const endpoint = `${API_DOMAIN}/kpis/tracking/employee/${encodeURIComponent(employeeId)}?skip=${skip}&limit=${limit}`;

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
            throw new Error(errorData.message || 'Failed to fetch employee KPI tracking records');
        }

        const data = await response.json();
        return data as KPITrackingRecord[];
    } catch (error) {
        console.error('Employee KPI tracking fetch error:', error);
        throw error;
    }
}

/**
 * Deletes a KPI tracking record
 * @param {string} trackingId - The ID of the tracking record to delete
 * @returns {Promise<KPITrackingRecord>} - A promise that resolves to the deleted tracking record
 * @throws {Error} - If the tracking record is not found or deletion fails
 */
export async function deleteKPITracking(trackingId: string): Promise<KPITrackingRecord> {
    const endpoint = `${API_DOMAIN}/kpis/tracking/${encodeURIComponent(trackingId)}`;

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
            throw new Error('KPI tracking record not found');
        }
        throw new Error('Failed to delete KPI tracking record');
    }
    
    const data = await response.json();
    return data as KPITrackingRecord;
}
