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
 * Updates a card by ID with company validation.
 * @param {string} cardId - The ID of the card to update.
 * @param {UpdateCardPayload} updateData - The data to update the card with.
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects).
 * @returns {Promise<CardData>} - A promise that resolves to the updated card data.
 */
export async function updateCard(cardId: string, updateData: UpdateCardPayload, companyId?: string): Promise<CardData> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/company/${encodeURIComponent(companyId)}`
        : `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}`;

    if (!companyId) {
        console.warn('⚠️ updateCard called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
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
        console.error('❌ Card update API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            cardId,
            companyId: companyId || 'not provided',
            endpoint
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to update this card');
        }
        
        throw new Error('Failed to update card');
    }

    return data as CardData;
}

/**
 * Creates a new card with company validation.
 * @param {Pick<CardData, 'list_id' | 'title' | 'position'>} cardData - The minimal required data for the new card.
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects).
 * @returns {Promise<CardData>} - A promise that resolves to the created card data.
 */
export async function createCard(cardData: Pick<CardData, 'list_id' | 'title' | 'position'>, companyId?: string): Promise<CardData> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/company/${encodeURIComponent(companyId)}/cards`
        : `${API_DOMAIN}/trello/cards`;

    if (!companyId) {
        console.warn('⚠️ createCard called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
    }

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
        console.error('❌ Card creation API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            sentData: cardData,
            companyId: companyId || 'not provided',
            endpoint
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to create cards in this company');
        }
        
        throw new Error(data.detail || 'Failed to create card');
    }

    return data as CardData;
}

/**
 * Deletes a card by ID with company validation.
 * @param {string} cardId - The ID of the card to delete.
 * @param {string} [companyId] - The company ID for secure access (recommended for Projects).
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful, false otherwise.
 */
export async function deleteCard(cardId: string, companyId?: string): Promise<boolean> {
    // Use secure company-based endpoint if companyId is provided
    const endpoint = companyId 
        ? `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/company/${encodeURIComponent(companyId)}`
        : `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}`;

    if (!companyId) {
        console.warn('⚠️ deleteCard called without companyId - using legacy endpoint. Consider updating to company-based access for better security.');
    }

    try {
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('❌ Card deletion API request failed:', {
                status: response.status,
                statusText: response.statusText,
                cardId,
                companyId: companyId || 'not provided',
                endpoint
            });
            
            if (response.status === 403) {
                console.error('Access denied: You do not have permission to delete this card');
            }
            
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to delete card:', error);
        return false;
    }
}
