import { BusinessQuadrant, Company } from '../types/company';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Payload for updating business quadrant
 */
export interface UpdateBusinessQuadrantPayload {
  business_quadrant: BusinessQuadrant;
}

/**
 * Updates the business quadrant for a company
 * @param {string} companyId - The ID of the company to update
 * @param {UpdateBusinessQuadrantPayload} payload - The business quadrant data
 * @returns {Promise<Company>} - A promise that resolves to the updated company data
 */
export async function updateBusinessQuadrant(
  companyId: string,
  payload: UpdateBusinessQuadrantPayload
): Promise<Company> {
  const endpoint = `${API_DOMAIN}/companies/${encodeURIComponent(companyId)}`;
  
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to update business quadrant');
  }

  return data as Company;
}

/**
 * Gets company information including business quadrant
 * @param {string} companyId - The ID of the company
 * @returns {Promise<Company>} - A promise that resolves to the company data
 */
export async function getCompany(companyId: string): Promise<Company> {
  const endpoint = `${API_DOMAIN}/companies/${encodeURIComponent(companyId)}`;

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
    throw new Error('Failed to get company information');
  }

  return data as Company;
}
