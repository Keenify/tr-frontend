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
}

export interface UpdateCardPayload {
    title?: string;
    description?: string;
    position?: number;
    due_date?: string;
    color_code?: string;
    list_id?: string;
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
