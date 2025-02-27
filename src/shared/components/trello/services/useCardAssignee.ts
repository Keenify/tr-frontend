// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

import { CardAssignee } from '../types/assignee.types';

/**
 * Assigns an employee to a card
 * @param {string} cardId - The ID of the card
 * @param {string} employeeId - The ID of the employee to assign
 * @returns {Promise<CardAssignee>} - A promise that resolves to the assignment data
 */
export async function assignEmployeeToCard(cardId: string, employeeId: string): Promise<CardAssignee> {
  const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/assignees/${encodeURIComponent(employeeId)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
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
    throw new Error('Failed to assign employee to card');
  }

  return data as CardAssignee;
}

/**
 * Unassigns an employee from a card
 * @param {string} cardId - The ID of the card
 * @param {string} employeeId - The ID of the employee to unassign
 * @returns {Promise<boolean>} - A promise that resolves to true if unassignment was successful
 */
export async function unassignEmployeeFromCard(cardId: string, employeeId: string): Promise<boolean> {
  const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/assignees/${encodeURIComponent(employeeId)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const data = await response.json();
    return data === true;
  } catch (error) {
    console.error('❌ Failed to unassign employee from card:', error);
    return false;
  }
}

/**
 * Gets all assignees for a specific card
 * @param {string} cardId - The ID of the card
 * @returns {Promise<CardAssignee[]>} - A promise that resolves to an array of card assignees
 */
export async function getCardAssignees(cardId: string): Promise<CardAssignee[]> {
  const endpoint = `${API_DOMAIN}/trello/cards/${encodeURIComponent(cardId)}/assignees`;

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
    throw new Error('Failed to get card assignees');
  }

  return data as CardAssignee[];
}

/**
 * Gets all cards assigned to a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<CardAssignee[]>} - A promise that resolves to an array of card assignments
 */
export async function getEmployeeAssignments(employeeId: string): Promise<CardAssignee[]> {
  const endpoint = `${API_DOMAIN}/trello/employees/${encodeURIComponent(employeeId)}/assignments`;

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
    throw new Error('Failed to get employee assignments');
  }

  return data as CardAssignee[];
}
