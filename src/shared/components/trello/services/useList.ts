const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { ListResponse, UpdateListRequest } from '../types/list.types';

interface CreateListRequest {
    name: string;
    position: number;
    country: string;
    board_id: string;
}

/**
 * Updates a Trello list by ID
 * @param {string} listId - The ID of the list to update
 * @param {UpdateListPayload} updateData - The data to update (name and/or position and/or country)
 * @returns {Promise<TrelloList>} - A promise that resolves to the updated list data
 */
export async function updateList(listId: string, updateData: UpdateListRequest): Promise<ListResponse> {
    const endpoint = `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}`;

    console.log('🌐 [updateList] Making API request:', {
        endpoint,
        listId,
        updateData,
        method: 'PATCH'
    });

    const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
    });
    

    const data = await response.json();

    console.log('🌐 [updateList] API response received:', {
        status: response.status,
        statusText: response.statusText,
        responseData: data
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update list');
    }

    return data as ListResponse;
}

/**
 * Creates a new Trello list
 * @param {CreateListRequest} createData - The data for the new list (name, position, country, and board_id)
 * @returns {Promise<ListResponse>} - A promise that resolves to the created list data
 */
export async function createList(createData: CreateListRequest): Promise<ListResponse> {
    const endpoint = `${API_DOMAIN}/trello/lists`;

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
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create list');
    }

    return data as ListResponse;
}

/**
 * Deletes a Trello list by ID
 * @param {string} listId - The ID of the list to delete
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
 */
export async function deleteList(listId: string): Promise<boolean> {
    const endpoint = `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}`;

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
        throw new Error('Failed to delete list');
    }

    return true;
}