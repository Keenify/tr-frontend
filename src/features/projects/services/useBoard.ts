// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;
export const HARDCODED_BOARD_ID = 'db9203fc-7425-477f-a2a4-ef304dcb4da7'; // Supplier Board

import { BoardDetails } from '../types/board';

// Interface for company projects board response
export interface CompanyProjectsBoardResponse {
    board_id: string;
    created: boolean;
}

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

/**
 * Gets or creates a company-specific 'Projects' board.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<CompanyProjectsBoardResponse>} - A promise that resolves to board ID and creation status.
 */
export async function getCompanyProjectsBoard(companyId: string): Promise<CompanyProjectsBoardResponse> {
    const endpoint = `${API_DOMAIN}/trello/companies/${encodeURIComponent(companyId)}/projects-board`;

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
        throw new Error('Failed to get company projects board');
    }

    return data as CompanyProjectsBoardResponse;
}
