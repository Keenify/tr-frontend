// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;
export const HARDCODED_BOARD_ID = 'fe279d07-c6c4-42ac-bf6e-d36924dac4b1';
export const PASSWORD_BOARD_ID = 'a4c660de-d84c-4b65-b2b2-eed47a9da30d'; // Replace with your actual password board ID
export const DIGITAL_ASSETS_BOARD_ID = '9ab427f7-f0bb-4c38-85fb-cd8640eab000'; // Digital Assets board ID

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
