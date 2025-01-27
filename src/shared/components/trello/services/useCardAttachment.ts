// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Define interfaces for the attachment data
export interface CardAttachment {
    file_url: string;
    file_type: string;
    is_thumbnail: boolean;
    thumbnail_path: string | null;
    id: string;
    card_id: string;
    created_at: string;
}

/**
 * Fetches attachments for a specific card.
 * @param {string} cardId - The ID of the card.
 * @returns {Promise<CardAttachment[]>} - A promise that resolves to an array of card attachments.
 */
export async function getCardAttachments(cardId: string): Promise<CardAttachment[]> {
    const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/attachments`;

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
        throw new Error('Failed to fetch card attachments');
    }

    return data as CardAttachment[];
}

/**
 * Fetches the file URL for a specific attachment.
 * @param {string} attachmentId - The ID of the attachment.
 * @returns {Promise<string>} - A promise that resolves to the file URL.
 */
export async function getAttachmentUrl(attachmentId: string): Promise<string> {
    const endpoint = `${API_DOMAIN}/trello/attachments/${encodeURIComponent(attachmentId)}/url`;

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
        throw new Error('Failed to fetch attachment URL');
    }

    return data as string;
}

/**
 * Deletes a specific attachment.
 * @param {string} attachmentId - The ID of the attachment to delete.
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful.
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
    const endpoint = `${API_DOMAIN}/trello/attachments/${encodeURIComponent(attachmentId)}`;

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
        throw new Error('Failed to delete attachment');
    }

    return true;
}

/**
 * Creates an attachment for a card
 * @param {string} cardId - The ID of the card to attach the file to
 * @param {File} file - The file to attach
 * @param {boolean} isThumbnail - Whether the file is a thumbnail
 * @returns {Promise<CardAttachment>} The created attachment data
 */
export async function createCardAttachment(
    cardId: string,
    file: File,
    isThumbnail: boolean
): Promise<CardAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    const endpoint = `${API_DOMAIN}/trello/attachments?card_id=${encodeURIComponent(cardId)}&is_thumbnail=${isThumbnail}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create attachment');
    }

    return data as CardAttachment;
}
