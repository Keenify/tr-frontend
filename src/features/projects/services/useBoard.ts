// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { BoardDetails } from '../types/board';

/**
 * Fetches company board details including lists and cards.
 * Uses the secure company-based endpoint that auto-creates boards for companies.
 * This is the new secure way to access Projects boards.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<BoardDetails>} - A promise that resolves to the board details.
 */
export async function getCompanyBoardDetails(companyId: string): Promise<BoardDetails> {
    const endpoint = `${API_DOMAIN}/trello/company/${encodeURIComponent(companyId)}/board`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Projects API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            companyId
        });
        
        if (response.status === 403) {
            throw new Error('Access denied: You do not have permission to access this company\'s projects board');
        }
        
        if (response.status === 404) {
            throw new Error('Company not found or projects board could not be created');
        }
        
        throw new Error('Failed to fetch projects board details');
    }

    return data as BoardDetails;
}

/**
 * @deprecated Use getCompanyBoardDetails instead. This function is kept for backward compatibility.
 * 
 * ⚠️ SECURITY WARNING: This function uses hardcoded board IDs which bypass company-based security.
 * Projects feature should use getCompanyBoardDetails(companyId) instead.
 * 
 * Other teams (Resources, Sales) may still use this until they implement their own security updates.
 * 
 * @param {string} boardId - The ID of the board.
 * @returns {Promise<BoardDetails>} - A promise that resolves to the board details.
 */
export async function getBoardDetails(boardId: string): Promise<BoardDetails> {
    console.warn('⚠️ getBoardDetails is deprecated for Projects. Use getCompanyBoardDetails with company ID instead.');
    console.warn('This function bypasses company-based security and should only be used during migration.');
    
    const endpoint = `${API_DOMAIN}/trello/boards/${encodeURIComponent(boardId)}/details`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Legacy API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            boardId
        });
        throw new Error('Failed to fetch board details');
    }

    return data as BoardDetails;
}

// Keep the old constant for backward compatibility with other features
// Projects feature should not use this anymore
export const HARDCODED_BOARD_ID = 'db9203fc-7425-477f-a2a4-ef304dcb4da7'; // For backward compatibility only
