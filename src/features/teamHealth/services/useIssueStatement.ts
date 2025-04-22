import { CreateIssueStatementPayload, IssueStatementData, UpdateIssueStatementPayload, PaginationParams } from '../types/issueStatement';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new issue statement
 * @param {CreateIssueStatementPayload} payload - The issue statement data to create
 * @returns {Promise<IssueStatementData>} - A promise that resolves to the created issue statement data
 */
export async function createIssueStatement(payload: CreateIssueStatementPayload): Promise<IssueStatementData> {
    const endpoint = `${API_DOMAIN}/issue-statements/`;

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
            data,
            endpoint,
            sentPayload: payload
        });
        throw new Error(`Failed to create issue statement: ${JSON.stringify(data)}`);
    }

    return data as IssueStatementData;
}

/**
 * Fetches issue statements for a specific company
 * @param {string} companyId - The ID of the company
 * @param {PaginationParams} params - Optional pagination parameters
 * @returns {Promise<IssueStatementData[]>} - A promise that resolves to an array of issue statement data
 */
export async function getCompanyIssueStatements(
    companyId: string,
    params: PaginationParams = { skip: 0, limit: 100 }
): Promise<IssueStatementData[]> {
    const { skip = 0, limit = 100 } = params;
    const endpoint = `${API_DOMAIN}/issue-statements/company/${encodeURIComponent(companyId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch company issue statements');
    }

    return data as IssueStatementData[];
}

/**
 * Fetches issue statements for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {PaginationParams} params - Optional pagination parameters
 * @returns {Promise<IssueStatementData[]>} - A promise that resolves to an array of issue statement data
 */
export async function getEmployeeIssueStatements(
    employeeId: string,
    params: PaginationParams = { skip: 0, limit: 100 }
): Promise<IssueStatementData[]> {
    const { skip = 0, limit = 100 } = params;
    const endpoint = `${API_DOMAIN}/issue-statements/employee/${encodeURIComponent(employeeId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch employee issue statements');
    }

    return data as IssueStatementData[];
}

/**
 * Fetches a specific issue statement by ID
 * @param {string} issueStatementId - The ID of the issue statement
 * @returns {Promise<IssueStatementData>} - A promise that resolves to the issue statement data
 */
export async function getIssueStatement(issueStatementId: string): Promise<IssueStatementData> {
    const endpoint = `${API_DOMAIN}/issue-statements/${encodeURIComponent(issueStatementId)}`;

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
        throw new Error('Failed to fetch issue statement');
    }

    return data as IssueStatementData;
}

/**
 * Updates an existing issue statement
 * @param {string} issueStatementId - The ID of the issue statement to update
 * @param {UpdateIssueStatementPayload} payload - The issue statement data to update
 * @returns {Promise<IssueStatementData>} - A promise that resolves to the updated issue statement data
 */
export async function updateIssueStatement(
    issueStatementId: string,
    payload: UpdateIssueStatementPayload
): Promise<IssueStatementData> {
    const endpoint = `${API_DOMAIN}/issue-statements/${encodeURIComponent(issueStatementId)}`;

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
        throw new Error('Failed to update issue statement');
    }

    return data as IssueStatementData;
}

/**
 * Deletes an issue statement
 * @param {string} issueStatementId - The ID of the issue statement to delete
 * @returns {Promise<IssueStatementData>} - A promise that resolves to the deleted issue statement data
 */
export async function deleteIssueStatement(issueStatementId: string): Promise<IssueStatementData> {
    const endpoint = `${API_DOMAIN}/issue-statements/${encodeURIComponent(issueStatementId)}`;

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
        throw new Error('Failed to delete issue statement');
    }

    return data as IssueStatementData;
}
