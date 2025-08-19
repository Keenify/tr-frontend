// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// DEPRECATED: Legacy hardcoded board IDs (kept for backward compatibility)
export const HARDCODED_BOARD_ID = 'fe279d07-c6c4-42ac-bf6e-d36924dac4b1';
export const PASSWORD_BOARD_ID = 'a4c660de-d84c-4b65-b2b2-eed47a9da30d'; // Replace with your actual password board ID
export const DIGITAL_ASSETS_BOARD_ID = '9ab427f7-f0bb-4c38-85fb-cd8640eab000'; // Digital Assets board ID

import { BoardDetails } from '../types/board';

/**
 * Company-specific board response from the API
 */
interface CompanyBoardResponse {
  board_id: string;
  created: boolean;
}

/**
 * Fetches company-specific resources templates board ID from the backend.
 * Creates a new empty board if one doesn't exist for the company.
 * @param {string} companyId - The ID of the company
 * @returns {Promise<CompanyBoardResponse>} - A promise that resolves to the board info
 */
export async function getCompanyResourcesTemplatesBoard(companyId: string): Promise<CompanyBoardResponse> {
  const endpoint = `${API_DOMAIN}/trello/companies/${encodeURIComponent(companyId)}/resources-templates-board`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to fetch company resources templates board:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to fetch company resources templates board');
  }

  return data as CompanyBoardResponse;
}

/**
 * Fetches company-specific resources digital assets board ID from the backend.
 * Creates a new empty board if one doesn't exist for the company.
 * @param {string} companyId - The ID of the company
 * @returns {Promise<CompanyBoardResponse>} - A promise that resolves to the board info
 */
export async function getCompanyResourcesAssetsBoard(companyId: string): Promise<CompanyBoardResponse> {
  const endpoint = `${API_DOMAIN}/trello/companies/${encodeURIComponent(companyId)}/resources-assets-board`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to fetch company resources assets board:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to fetch company resources assets board');
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
