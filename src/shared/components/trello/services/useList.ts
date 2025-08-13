const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { ListResponse, UpdateListRequest } from '../types/list.types';

interface CreateListRequest {
    name: string;
    position: number;
    country: string;
    board_id: string;
}

/**
 * Updates a Trello list by ID with company validation
 * @param {string} listId - The ID of the list to update
 * @param {UpdateListRequest} updateData - The data to update (name and/or position and/or country)
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects)
 * @returns {Promise<ListResponse>} - A promise that resolves to the updated list data
 */
export async function updateList(listId: string, updateData: UpdateListRequest, companyId?: string): Promise<ListResponse> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}/company/${encodeURIComponent(companyId)}`
        : `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}`;

    if (!companyId) {
        console.warn('⚠️ updateList called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
    }

    const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ List update API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            listId,
            companyId: companyId || 'not provided',
            endpoint
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to update this list');
        }
        
        throw new Error('Failed to update list');
    }

    return data as ListResponse;
}

/**
 * Creates a new Trello list with company validation
 * @param {CreateListRequest} createData - The data for the new list (name, position, country, and board_id)
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects)
 * @returns {Promise<ListResponse>} - A promise that resolves to the created list data
 */
export async function createList(createData: CreateListRequest, companyId?: string): Promise<ListResponse> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/company/${encodeURIComponent(companyId)}/lists`
        : `${API_DOMAIN}/trello/lists`;

    if (!companyId) {
        console.warn('⚠️ createList called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
    });
    
    const data = await response.json();

    if (!response.ok) {
        console.error('❌ List creation API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            createData,
            companyId: companyId || 'not provided',
            endpoint
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to create lists in this company');
        }
        
        throw new Error('Failed to create list');
    }

    return data as ListResponse;
}

/**
 * Deletes a Trello list by ID with company validation
 * @param {string} listId - The ID of the list to delete
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects)
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
 */
export async function deleteList(listId: string, companyId?: string): Promise<boolean> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}/company/${encodeURIComponent(companyId)}`
        : `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}`;

    if (!companyId) {
        console.warn('⚠️ deleteList called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
    }

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        console.error('❌ List deletion API request failed:', {
            status: response.status,
            statusText: response.statusText,
            listId,
            companyId: companyId || 'not provided',
            endpoint
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to delete this list');
        }
        
        throw new Error('Failed to delete list');
    }

    return true;
}