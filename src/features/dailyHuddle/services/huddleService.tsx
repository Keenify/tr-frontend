import { FORM_ID } from '../constants'; // Assuming you have a constants file where FORM_ID is defined
import { 
  Question, 
  SubmitResponseData, 
  SubmitResponseResult, 
  ResponseData,
  UpdateAnswerData,
  UpdateResponseResult 
} from '../types/huddle.types';

// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Checks if the FORM_ID is set.
 * Logs a warning if FORM_ID is not set and returns false.
 * @returns {boolean} - True if FORM_ID is set, otherwise false.
 */
const checkFormId = (): boolean => {
  if (!FORM_ID) {
    console.warn('FORM_ID is not set. Operation is not available.');
    return false;
  }
  return true;
};

/**
 * Fetches the list of questions for the daily huddle form.
 * @returns {Promise<Question[]>} - A promise that resolves to an array of Question objects.
 * @throws Will throw an error if the fetch operation fails.
 */
export const fetchQuestions = async (): Promise<Question[]> => {
  if (!checkFormId()) {
    return [];
  }

  const url = `${API_DOMAIN}/forms/questions/${FORM_ID}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.statusText}`);
    }

    const data: Question[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
};

/**
 * Fetches the response data for a specific date and employee.
 * @param {string} date - The date for which to fetch the response.
 * @param {string} employeeId - The ID of the employee.
 * @returns {Promise<ResponseData | null>} - A promise that resolves to the response data or null if not found.
 * @throws Will throw an error if the fetch operation fails.
 */
export async function fetchResponse(date: string, employeeId: string): Promise<ResponseData | null> {
  const url = `${API_DOMAIN}/forms/responses/?date=${date}&employee_id=${employeeId}&questionnaire_id=${FORM_ID}`;
  console.log("Fetching response from:", url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("No response found for this date and employee");
        return null; // Employee hasn't submitted
      } else {
        console.error(`Error ${response.status}: ${response.statusText}`);
        try {
          const errorData = await response.json();
          console.error('Error Data:', errorData);
        } catch {
          console.error('Could not parse error response as JSON');
        }
        return null;
      }
    }

    const data = await response.json();
    console.log("Response data retrieved:", data);
    return data as ResponseData;
  } catch (error) {
    console.error('Failed to fetch response:', error);
    return null; // Return null instead of throwing to prevent app crashes
  }
}

/**
 * Checks if the employee has submitted a response today.
 * @param {string} employeeId - The ID of the employee.
 * @returns {Promise<boolean>} - A promise that resolves to true if the employee has submitted a response today, otherwise false.
 */
export const hasSubmittedResponseToday = async (employeeId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const response = await fetchResponse(today, employeeId);
  return response !== null;
};

/**
 * Submits the response data for the daily huddle form.
 * @param {SubmitResponseData} data - The response data to be submitted.
 * @returns {Promise<SubmitResponseResult>} - A promise that resolves to the result of the submission.
 * @throws Will throw an error if the submission fails.
 */
export const submitResponse = async (data: SubmitResponseData): Promise<SubmitResponseResult> => {
  const url = `${API_DOMAIN}/forms/responses-with-answers/`;
  
  console.log("Submitting response to:", url);
  console.log("Request payload:", JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`Error ${response.status}: ${response.statusText}`);
      try {
        const errorData = await response.text();
        console.error('Error Response:', errorData);
      } catch {
        console.error('Could not parse error response');
      }
      throw new Error(`Error submitting response: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log("Response submission successful:", JSON.stringify(responseData, null, 2));
    return responseData as SubmitResponseResult;
  } catch (error) {
    console.error('Failed to submit response:', error);
    throw error;
  }
};

/**
 * Updates the answers for an existing response.
 * @param {string} responseId - The ID of the response to update.
 * @param {UpdateAnswerData[]} answers - Array of answers to update.
 * @returns {Promise<UpdateResponseResult>} - A promise that resolves to the result of the update.
 * @throws Will throw an error if the update fails.
 */
export const updateResponse = async (
  responseId: string, 
  answers: UpdateAnswerData[]
): Promise<UpdateResponseResult> => {
  const url = `${API_DOMAIN}/forms/responses/${responseId}/update-answers/`;
  
  console.log("Updating response at:", url);
  console.log("Update payload:", JSON.stringify(answers, null, 2));

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers),
    });

    if (!response.ok) {
      console.error(`Error ${response.status}: ${response.statusText}`);
      try {
        const errorText = await response.text();
        console.error('Error Response:', errorText);
      } catch {
        console.error('Could not read error response');
      }
      throw new Error(`Error updating response: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Update response successful:", JSON.stringify(result, null, 2));
    return result as UpdateResponseResult;
  } catch (error) {
    console.error('Failed to update response:', error);
    throw error;
  }
};

