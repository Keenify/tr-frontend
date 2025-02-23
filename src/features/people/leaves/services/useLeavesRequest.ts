import { LeaveRequest, CreateLeaveRequestPayload, UpdateLeaveRequestPayload } from '../types/leaveRequest';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new leave request for an employee
 * @param {string} employeeId - The ID of the employee
 * @param {CreateLeaveRequestPayload} payload - The leave request data
 * @returns {Promise<LeaveRequest>} - A promise that resolves to the created leave request
 */
export async function createLeaveRequest(
    employeeId: string,
    payload: CreateLeaveRequestPayload
): Promise<LeaveRequest> {
    console.log('Creating leave request with:', {
        employeeId,
        endpoint: `${API_DOMAIN}/employee-leaves/request?employee_id=${encodeURIComponent(employeeId)}`,
        payload
    });
    
    const endpoint = `${API_DOMAIN}/employee-leaves/request?employee_id=${encodeURIComponent(employeeId)}`;
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        data,
        sentPayload: payload
    });

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data,
            payload
        });
        throw new Error('Failed to create leave request');
    }

    return data as LeaveRequest;
}

/**
 * Fetches a specific leave request by ID
 * @param {string} requestId - The ID of the leave request
 * @returns {Promise<LeaveRequest>} - A promise that resolves to the leave request data
 */
export async function getLeaveRequest(requestId: string): Promise<LeaveRequest> {
    const endpoint = `${API_DOMAIN}/employee-leaves/request/${encodeURIComponent(requestId)}`;

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
        throw new Error('Failed to fetch leave request');
    }

    return data as LeaveRequest;
}

/**
 * Updates a leave request
 * @param {string} requestId - The ID of the leave request to update
 * @param {UpdateLeaveRequestPayload} payload - The update data
 * @returns {Promise<LeaveRequest>} - A promise that resolves to the updated leave request
 */
export async function updateLeaveRequest(
    requestId: string,
    payload: UpdateLeaveRequestPayload
): Promise<LeaveRequest> {
    const endpoint = `${API_DOMAIN}/employee-leaves/request/${encodeURIComponent(requestId)}`;

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
        throw new Error('Failed to update leave request');
    }

    return data as LeaveRequest;
}

/**
 * Fetches all leave requests for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<LeaveRequest[]>} - A promise that resolves to an array of leave requests
 */
export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    const endpoint = `${API_DOMAIN}/employee-leaves/request/employee/${encodeURIComponent(employeeId)}`;

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
        throw new Error('Failed to fetch employee leave requests');
    }

    return data as LeaveRequest[];
}

/**
 * Fetches all leave requests for a company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<LeaveRequest[]>} - A promise that resolves to an array of leave requests
 */
export async function getCompanyLeaveRequests(companyId: string): Promise<LeaveRequest[]> {
    const endpoint = `${API_DOMAIN}/employee-leaves/request/company/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company leave requests');
    }

    return data as LeaveRequest[];
}
