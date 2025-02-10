import { CreateFeedbackParams, FeedbackResponse, ApiResponse } from '../types/feedback';

// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new feedback entry for an employee
 * @param {CreateFeedbackParams} params - The feedback creation parameters
 * @returns {Promise<FeedbackResponse>} - A promise that resolves to the created feedback
 */
export async function createFeedback(params: CreateFeedbackParams): Promise<FeedbackResponse> {
    const { userId, companyId, feedback } = params;
    const endpoint = `${API_DOMAIN}/employee-feedbacks`;

    const queryParams = new URLSearchParams({
        user_id: userId,
        company_id: companyId,
    });

    const response = await fetch(`${endpoint}?${queryParams}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to create feedback:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create feedback');
    }

    return data as FeedbackResponse;
}

/**
 * Fetches all feedback entries for a specific employee with employee details
 * @param {string} userId - The ID of the employee
 * @returns {Promise<FeedbackResponse[]>} - A promise that resolves to an array of feedback entries with employee details
 */
export async function getEmployeeFeedbacks(userId: string): Promise<FeedbackResponse[]> {
    const endpoint = `${API_DOMAIN}/employee-feedbacks/employee/${encodeURIComponent(userId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to fetch employee feedbacks:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to fetch employee feedbacks');
    }

    // Transform the response to match our interface
    return data.map((item: ApiResponse) => ({
        ...item,
        userId: item.user_id,
        companyId: item.company_id,
        createdAt: item.created_at,
    })) as FeedbackResponse[];
}
