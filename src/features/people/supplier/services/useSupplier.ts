import { CreateSupplierPayload, SupplierData, UpdateSupplierPayload, SupplierAttachmentResponse } from '../types/supplier';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new supplier for a company
 * @param {CreateSupplierPayload} payload - The supplier data to create
 * @returns {Promise<SupplierData>} - A promise that resolves to the created supplier data
 */
export async function createSupplier(payload: CreateSupplierPayload): Promise<SupplierData> {
    const endpoint = `${API_DOMAIN}/suppliers/`;

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
        throw new Error('Failed to create supplier');
    }

    return data as SupplierData;
}

/**
 * Fetches suppliers for a specific company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<SupplierData[]>} - A promise that resolves to an array of supplier data
 */
export async function getCompanySuppliers(companyId: string): Promise<SupplierData[]> {
    const endpoint = `${API_DOMAIN}/suppliers/company/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company suppliers');
    }

    return data as SupplierData[];
}

/**
 * Fetches a specific supplier by ID
 * @param {string} supplierId - The ID of the supplier
 * @returns {Promise<SupplierData>} - A promise that resolves to the supplier data
 */
export async function getSupplier(supplierId: string): Promise<SupplierData> {
    const endpoint = `${API_DOMAIN}/suppliers/${encodeURIComponent(supplierId)}`;

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
        throw new Error('Failed to fetch supplier');
    }

    return data as SupplierData;
}

/**
 * Updates an existing supplier
 * @param {string} supplierId - The ID of the supplier to update
 * @param {UpdateSupplierPayload} payload - The supplier data to update
 * @returns {Promise<SupplierData>} - A promise that resolves to the updated supplier data
 */
export async function updateSupplier(
    supplierId: string,
    payload: UpdateSupplierPayload
): Promise<SupplierData> {
    const endpoint = `${API_DOMAIN}/suppliers/${encodeURIComponent(supplierId)}`;

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
        throw new Error('Failed to update supplier');
    }

    return data as SupplierData;
}

/**
 * Deletes a supplier
 * @param {string} supplierId - The ID of the supplier to delete
 * @returns {Promise<{ message: string }>} - A promise that resolves to a success message
 */
export async function deleteSupplier(supplierId: string): Promise<{ message: string }> {
    const endpoint = `${API_DOMAIN}/suppliers/${encodeURIComponent(supplierId)}`;

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
        throw new Error('Failed to delete supplier');
    }

    return data as { message: string };
}

/**
 * Updates attachment information for a supplier
 * @param {string} fileUrl - The URL of the file
 * @param {string} description - The description of the attachment
 * @param {string} supplierId - The ID of the supplier
 * @returns {Promise<SupplierAttachmentResponse>} - A promise that resolves to the updated attachment information
 */
export async function updateSupplierAttachment(
    fileUrl: string,
    description: string,
    supplierId: string
): Promise<SupplierAttachmentResponse> {
    const endpoint = `${API_DOMAIN}/suppliers/attachments/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            file_url: fileUrl,
            description,
            supplier_id: supplierId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update supplier attachment');
    }

    return data as SupplierAttachmentResponse;
}

/**
 * Deletes an attachment for a supplier
 * @param {string} attachmentId - The ID of the attachment to delete
 * @returns {Promise<{ message: string }>} - A promise that resolves to a success message
 */
export async function deleteSupplierAttachment(attachmentId: string): Promise<{ message: string }> {
    const endpoint = `${API_DOMAIN}/suppliers/attachments/${encodeURIComponent(attachmentId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const data = await response.json();
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to delete supplier attachment');
    }

    return { message: 'Attachment deleted successfully' };
}
