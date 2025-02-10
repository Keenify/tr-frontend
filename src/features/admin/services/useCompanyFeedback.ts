import { FeedbackResponse, ApiResponse } from '../../feedback/types/feedback';

// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Fetches all feedback entries for a specific company with employee details
 * @param {string} companyId - The ID of the company
 * @returns {Promise<FeedbackResponse[]>} - A promise that resolves to an array of feedback entries with employee details
 */
export async function getCompanyFeedbacks(companyId: string): Promise<FeedbackResponse[]> {
    const endpoint = `${API_DOMAIN}/employee-feedbacks/company/${encodeURIComponent(companyId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to fetch company feedbacks:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to fetch company feedbacks');
    }

    // Transform the response to match our interface
    return data.map((item: ApiResponse) => ({
        ...item,
        userId: item.user_id,
        companyId: item.company_id,
        createdAt: item.created_at,
    })) as FeedbackResponse[];
}
