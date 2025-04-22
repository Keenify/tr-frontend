import { 
    CreateIssueStatementAnswerPayload, 
    IssueStatementAnswerData, 
    UpdateIssueStatementAnswerPayload, 
    PaginationParams 
} from '../types/issueStatementAnswer';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new issue statement answer
 * @param {CreateIssueStatementAnswerPayload} payload - The issue statement answer data to create
 * @returns {Promise<IssueStatementAnswerData>} - A promise that resolves to the created issue statement answer data
 */
export async function createIssueStatementAnswer(payload: CreateIssueStatementAnswerPayload): Promise<IssueStatementAnswerData> {
    const endpoint = `${API_DOMAIN}/issue-statement-answers/`;

    const response = await fetch(endpoint, {
        method: 'POST',
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
        throw new Error('Failed to create issue statement answer');
    }

    return data as IssueStatementAnswerData;
}

/**
 * Fetches answers for a specific issue statement
 * @param {string} issueStatementId - The ID of the issue statement
 * @param {PaginationParams} params - Optional pagination parameters
 * @returns {Promise<IssueStatementAnswerData[]>} - A promise that resolves to an array of issue statement answer data
 */
export async function getIssueStatementAnswers(
    issueStatementId: string,
    params: PaginationParams = { skip: 0, limit: 100 }
): Promise<IssueStatementAnswerData[]> {
    const { skip = 0, limit = 100 } = params;
    const endpoint = `${API_DOMAIN}/issue-statement-answers/issue-statement/${encodeURIComponent(issueStatementId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch issue statement answers');
    }

    return data as IssueStatementAnswerData[];
}

/**
 * Fetches a specific issue statement answer by ID
 * @param {string} answerId - The ID of the issue statement answer
 * @returns {Promise<IssueStatementAnswerData>} - A promise that resolves to the issue statement answer data
 */
export async function getIssueStatementAnswer(answerId: string): Promise<IssueStatementAnswerData> {
    const endpoint = `${API_DOMAIN}/issue-statement-answers/${encodeURIComponent(answerId)}`;

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
        throw new Error('Failed to fetch issue statement answer');
    }

    return data as IssueStatementAnswerData;
}

/**
 * Updates an existing issue statement answer
 * @param {string} answerId - The ID of the issue statement answer to update
 * @param {UpdateIssueStatementAnswerPayload} payload - The issue statement answer data to update
 * @returns {Promise<IssueStatementAnswerData>} - A promise that resolves to the updated issue statement answer data
 */
export async function updateIssueStatementAnswer(
    answerId: string,
    payload: UpdateIssueStatementAnswerPayload
): Promise<IssueStatementAnswerData> {
    const endpoint = `${API_DOMAIN}/issue-statement-answers/${encodeURIComponent(answerId)}`;

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
        throw new Error('Failed to update issue statement answer');
    }

    return data as IssueStatementAnswerData;
}

/**
 * Deletes an issue statement answer
 * @param {string} answerId - The ID of the issue statement answer to delete
 * @returns {Promise<IssueStatementAnswerData>} - A promise that resolves to the deleted issue statement answer data
 */
export async function deleteIssueStatementAnswer(answerId: string): Promise<IssueStatementAnswerData> {
    const endpoint = `${API_DOMAIN}/issue-statement-answers/${encodeURIComponent(answerId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
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
        throw new Error('Failed to delete issue statement answer');
    }

    return data as IssueStatementAnswerData;
}
