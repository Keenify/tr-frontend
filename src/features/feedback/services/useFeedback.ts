// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

interface CreateFeedbackParams {
    userId: string;
    companyId: string;
    feedback: string;
}

interface Employee {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    user_id: string;
    completed_sign_up_sequence: boolean;
    profile_pic_url: string | null;
    company_id: string;
    reports_to: string;
    highest_rank: boolean;
    id: string;
    created_at: string;
}

interface FeedbackResponse {
    id: string;
    feedback: string;
    userId: string;
    companyId: string;
    createdAt: string;
    employee: Employee;
}

interface ApiResponse {
    user_id: string;
    company_id: string;
    created_at: string;
    feedback: string;
    id: string;
    employee: Employee;
}

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
