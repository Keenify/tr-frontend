import { FORM_ID } from '../constants'; // Assuming you have a constants file where FORM_ID is defined
import { Question, SubmitResponseData, SubmitResponseResult } from '../types/huddle.types';

// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;



const checkFormId = (): boolean => {
  if (!FORM_ID) {
    console.warn('FORM_ID is not set. Operation is not available.');
    return false;
  }
  return true;
};

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

// Define the expected response structure
interface QuestionResponse {
  question_id: string;
  question_text: string;
  answer_text: string;
}

export interface ResponseData {
  submitted_date: string;
  questions: QuestionResponse[];
}

export async function fetchResponse(date: string, employeeId: string): Promise<ResponseData | null> {
  const url = `${API_DOMAIN}/forms/responses/?date=${date}&employee_id=${employeeId}&questionnaire_id=${FORM_ID}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if(response.status === 404) {
        const errorData = await response.json();
        if (errorData.detail === "Response not found") {
          return null; // Employee hasn't submitted
        }
      } else {
        console.log('Error Data:', await response.json()); // Log other errors
      }
    }

    return await response.json() as ResponseData;
  } catch (error) {
    console.error('Failed to fetch response:', error);
    throw error;
  }
}

export const hasSubmittedResponseToday = async (employeeId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const response = await fetchResponse(today, employeeId);
  return response !== null;
};


export const submitResponse = async (data: SubmitResponseData): Promise<SubmitResponseResult> => {
  const url = `${API_DOMAIN}/forms/responses-with-answers/`;

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
      throw new Error(`Error submitting response: ${response.statusText}`);
    }
    const responseData = await response.json(); // Read the response body once
    return responseData as SubmitResponseResult;
  } catch (error) {
    console.error('Failed to submit response:', error);
    throw error;
  }
};
