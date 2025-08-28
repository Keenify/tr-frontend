// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { BoardDetails } from '../types/board';

// Interface for company creative management board response
export interface CompanyCreativeBoardResponse {
    board_id: string;
    created: boolean;
}

/**
 * Fetches board details including lists and cards by board ID.
 * @param {string} boardId - The ID of the board.
 * @returns {Promise<BoardDetails>} - A promise that resolves to the board details.
 */
export async function getBoardDetails(boardId: string): Promise<BoardDetails> {
    const endpoint = `${API_DOMAIN}/trello/boards/${encodeURIComponent(boardId)}/details`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Creative Management API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to fetch creative management board details');
    }

    return data as BoardDetails;
}

/**
 * Gets or creates a company-specific 'Creative Management Board'.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<CompanyCreativeBoardResponse>} - A promise that resolves to board ID and creation status.
 */
export async function getCompanyCreativeBoard(companyId: string): Promise<CompanyCreativeBoardResponse> {
    const endpoint = `${API_DOMAIN}/trello/companies/${encodeURIComponent(companyId)}/creative-management-board`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Creative Management API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to get company creative management board');
    }

    return data as CompanyCreativeBoardResponse;
}