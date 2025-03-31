// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Define interfaces for the card data
export interface CardData {
    title: string;
    position: number;
    description: string;
    due_date: string;
    color_code: string;
    id: string;
    list_id: string;
    created_at: string;
    start_date: string;
    end_date: string;
    is_locked: boolean;
    locked_by?: string;
}

export interface UpdateCardPayload {
    title?: string;
    description?: string;
    position?: number;
    due_date?: string;
    color_code?: string;
    list_id?: string;
    start_date?: string;
    end_date?: string;
    is_locked?: boolean;
    locked_by?: string;
}

/**
 * Updates a card by ID.
 * @param {string} cardId - The ID of the card to update.
 * @param {UpdateCardPayload} updateData - The data to update the card with.
 * @returns {Promise<CardData>} - A promise that resolves to the updated card data.
 */
export async function updateCard(cardId: string, updateData: UpdateCardPayload): Promise<CardData> {
    const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}`;

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
        throw new Error('Failed to update card');
    }

    return data as CardData;
}

/**
 * Creates a new card.
 * @param {Pick<CardData, 'list_id' | 'title' | 'position'>} cardData - The minimal required data for the new card.
 * @returns {Promise<CardData>} - A promise that resolves to the created card data.
 */
export async function createCard(cardData: Pick<CardData, 'list_id' | 'title' | 'position'>): Promise<CardData> {
    const endpoint = `${API_DOMAIN}/trello/cards`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            sentData: cardData
        });
        throw new Error(data.detail || 'Failed to create card');
    }

    return data as CardData;
}

/**
 * Deletes a card by ID.
 * @param {string} cardId - The ID of the card to delete.
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful, false otherwise.
 */
export async function deleteCard(cardId: string): Promise<boolean> {
    const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}`;

    try {
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
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to delete card:', error);
        return false;
    }
}
