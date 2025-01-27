const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { ListResponse, UpdateListRequest } from '../types/list.types';

/**
 * Updates a Trello list by ID
 * @param {string} listId - The ID of the list to update
 * @param {UpdateListPayload} updateData - The data to update (name and/or position)
 * @returns {Promise<TrelloList>} - A promise that resolves to the updated list data
 */
export async function updateList(listId: string, updateData: UpdateListRequest): Promise<ListResponse> {
    const endpoint = `${API_DOMAIN}/trello/lists/${encodeURIComponent(listId)}`;

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
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update list');
    }

    return data as ListResponse;
}