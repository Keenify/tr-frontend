// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// DEPRECATED: Legacy hardcoded board ID (kept for backward compatibility)
export const HARDCODED_BOARD_ID = '0b9d94dd-1796-43f3-8021-5e22f923ef8a'; // Sales Board

import { BoardDetails } from '../types/board';

/**
 * Company-specific board response from the API
 */
interface CompanyBoardResponse {
  board_id: string;
  created: boolean;
}

/**
 * Fetches company-specific sales board ID from the backend.
 * Creates a new empty board if one doesn't exist for the company.
 * @param {string} companyId - The ID of the company
 * @returns {Promise<CompanyBoardResponse>} - A promise that resolves to the board info
 */
export async function getCompanySalesBoard(companyId: string): Promise<CompanyBoardResponse> {
  const endpoint = `${API_DOMAIN}/trello/companies/${encodeURIComponent(companyId)}/sales-board`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to fetch company sales board:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to fetch company sales board');
  }

  return data as CompanyBoardResponse;
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
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to fetch board details');
    }

    return data as BoardDetails;
}
