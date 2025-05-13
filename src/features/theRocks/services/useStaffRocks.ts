const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import {
  StaffRockData,
  CreateStaffRockPayload,
  UpdateStaffRockPayload,
} from '../types/staffRocks';

/**
 * Creates a new staff rock.
 * @param {string} companyId - The ID of the company.
 * @param {CreateStaffRockPayload} payload - The staff rock data to create.
 * @returns {Promise<StaffRockData>} - A promise that resolves to the created staff rock data.
 */
export async function createStaffRock(companyId: string, payload: CreateStaffRockPayload): Promise<StaffRockData> {
  const endpoint = `${API_DOMAIN}/staff-rocks/${encodeURIComponent(companyId)}`;
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
    console.error(`[createStaffRock] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to create staff rock: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as StaffRockData;
}

/**
 * Fetches staff rocks for a specific company, optionally filtered by employee.
 * @param {string} companyId - The ID of the company.
 * @param {string} [employeeId] - Optional ID of the employee to filter by.
 * @returns {Promise<StaffRockData[]>} - A promise that resolves to an array of staff rock data.
 */
export async function getCompanyStaffRocks(companyId: string, employeeId?: string): Promise<StaffRockData[]> {
  let endpoint = `${API_DOMAIN}/staff-rocks/company/${encodeURIComponent(companyId)}`;
  if (employeeId) {
    endpoint += `?employee_id=${encodeURIComponent(employeeId)}`;
  }
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[getCompanyStaffRocks] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to fetch company staff rocks: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as StaffRockData[];
}

/**
 * Fetches a specific staff rock by its ID and company ID.
 * @param {string} staffRockId - The ID of the staff rock.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<StaffRockData>} - A promise that resolves to the staff rock data.
 */
export async function getStaffRockById(staffRockId: string, companyId: string): Promise<StaffRockData> {
  const endpoint = `${API_DOMAIN}/staff-rocks/${encodeURIComponent(staffRockId)}/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error(`[getStaffRockById] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to fetch staff rock by ID: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as StaffRockData;
}

/**
 * Updates an existing staff rock.
 * @param {string} staffRockId - The ID of the staff rock to update.
 * @param {string} companyId - The ID of the company.
 * @param {UpdateStaffRockPayload} payload - The staff rock data to update.
 * @returns {Promise<StaffRockData>} - A promise that resolves to the updated staff rock data.
 */
export async function updateStaffRock(staffRockId: string, companyId: string, payload: UpdateStaffRockPayload): Promise<StaffRockData> {
  const endpoint = `${API_DOMAIN}/staff-rocks/${encodeURIComponent(staffRockId)}/company/${encodeURIComponent(companyId)}`;
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
    console.error(`[updateStaffRock] API Error: ${response.status}`, responseData);
    throw new Error(`Failed to update staff rock: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }
  return responseData as StaffRockData;
}

/**
 * Deletes a staff rock.
 * @param {string} staffRockId - The ID of the staff rock to delete.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<void>} - A promise that resolves when the staff rock is deleted.
 */
export async function deleteStaffRock(staffRockId: string, companyId: string): Promise<void> {
  const endpoint = `${API_DOMAIN}/staff-rocks/${encodeURIComponent(staffRockId)}/company/${encodeURIComponent(companyId)}`;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorData = await response.json();
      errorDetail = JSON.stringify(errorData);
    } catch (e) {
      console.warn("[deleteStaffRock] Could not parse error response as JSON or response was empty.", e);
    }
    console.error(`[deleteStaffRock] API Error: ${response.status}`, errorDetail);
    throw new Error(`Failed to delete staff rock: ${response.status} - ${errorDetail}`);
  }
  // No content is returned on successful deletion (204)
}
