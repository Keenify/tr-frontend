// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;
export const HARDCODED_BOARD_ID = 'aa313179-54f3-46af-b160-7655eff90ad8'; // Client Board

import { BoardDetails } from '../types/board';

/**
 * Fetches board details including lists and cards by board ID.
 * @param {string} boardId - The ID of the board.
 * @returns {Promise<BoardDetails>} - A promise that resolves to the board details.
 */
export async function getBoardDetails(boardId: string = HARDCODED_BOARD_ID): Promise<BoardDetails> {
    const endpoint = `${API_DOMAIN}/trello/boards/${encodeURIComponent(boardId)}/details`;

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
        throw new Error('Failed to fetch board details');
    }

    return data as BoardDetails;
}
