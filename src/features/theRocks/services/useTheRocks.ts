const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { 
  TheRockData, 
  CreateTheRockPayload, 
  UpdateTheRockPayload 
} from '../types/theRocks'; // Updated import path

/**
 * Creates a new company rock.
 * @param {string} companyId - The ID of the company.
 * @param {CreateTheRockPayload} payload - The rock data to create.
 * @returns {Promise<TheRockData>} - A promise that resolves to the created rock data.
 */
export async function createTheRock(companyId: string, payload: CreateTheRockPayload): Promise<TheRockData> {
  const endpoint = `${API_DOMAIN}/the-rocks/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[createTheRock] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to create company rock: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as TheRockData;
}

/**
 * Fetches all rocks for a specific company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<TheRockData[]>} - A promise that resolves to an array of rock data.
 */
export async function getCompanyTheRocks(companyId: string): Promise<TheRockData[]> {
  const endpoint = `${API_DOMAIN}/the-rocks/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[getCompanyTheRocks] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to fetch company rocks: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as TheRockData[];
}

/**
 * Fetches a specific rock by its ID and company ID.
 * @param {string} rockId - The ID of the rock.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<TheRockData>} - A promise that resolves to the rock data.
 */
export async function getTheRockById(rockId: string, companyId: string): Promise<TheRockData> {
  const endpoint = `${API_DOMAIN}/the-rocks/${encodeURIComponent(rockId)}/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[getTheRockById] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to fetch rock by ID: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as TheRockData;
}

/**
 * Updates an existing company rock.
 * @param {string} rockId - The ID of the rock to update.
 * @param {string} companyId - The ID of the company.
 * @param {UpdateTheRockPayload} payload - The rock data to update.
 * @returns {Promise<TheRockData>} - A promise that resolves to the updated rock data.
 */
export async function updateTheRock(rockId: string, companyId: string, payload: UpdateTheRockPayload): Promise<TheRockData> {
  const endpoint = `${API_DOMAIN}/the-rocks/${encodeURIComponent(rockId)}/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[updateTheRock] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to update company rock: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as TheRockData;
}

/**
 * Deletes a company rock.
 * @param {string} rockId - The ID of the rock to delete.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<void>} - A promise that resolves when the rock is deleted.
 */
export async function deleteTheRock(rockId: string, companyId: string): Promise<void> {
  const endpoint = `${API_DOMAIN}/the-rocks/${encodeURIComponent(rockId)}/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorData = await response.json();
      errorDetail = JSON.stringify(errorData);
    } catch (caughtError) {
      // If response.json() fails, stick with response.statusText
      console.warn("[deleteTheRock] Could not parse error response as JSON or response was empty:", caughtError);
    }
    console.error(`[deleteTheRock] API Error: ${response.status}`, errorDetail);
    throw new Error(`Failed to delete company rock: ${response.status} - ${errorDetail}`);
  }
  // No content is returned on successful deletion (204)
}
