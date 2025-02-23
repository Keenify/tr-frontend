import { LeaveBalance, CreateLeaveBalancePayload, UpdateLeaveBalancePayload } from '../types/leaves';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates or updates leave balance for an employee
 * @param {string} employeeId - The ID of the employee
 * @param {CreateLeaveBalancePayload} payload - The leave balance data to create
 * @returns {Promise<LeaveBalance>} - A promise that resolves to the created leave balance data
 */
export async function createLeaveBalance(
    employeeId: string,
    payload: CreateLeaveBalancePayload
): Promise<LeaveBalance> {
    const endpoint = `${API_DOMAIN}/employee-leaves/balance?employee_id=${encodeURIComponent(employeeId)}`;

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
        throw new Error('Failed to create leave balance');
    }

    return data as LeaveBalance;
}

/**
 * Fetches leave balance for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<LeaveBalance>} - A promise that resolves to the leave balance data
 */
export async function getEmployeeLeaveBalance(employeeId: string): Promise<LeaveBalance> {
    const endpoint = `${API_DOMAIN}/employee-leaves/balance/${encodeURIComponent(employeeId)}`;

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
        throw new Error('Failed to fetch employee leave balance');
    }

    return data as LeaveBalance;
}

/**
 * Updates leave balance for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {UpdateLeaveBalancePayload} payload - The leave balance data to update
 * @returns {Promise<LeaveBalance>} - A promise that resolves to the updated leave balance data
 */
export async function updateLeaveBalance(
    employeeId: string,
    payload: UpdateLeaveBalancePayload
): Promise<LeaveBalance> {
    const endpoint = `${API_DOMAIN}/employee-leaves/balance/${encodeURIComponent(employeeId)}`;

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
        throw new Error('Failed to update leave balance');
    }

    return data as LeaveBalance;
}

/**
 * Fetches leave balances for all employees in a company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<LeaveBalance[]>} - A promise that resolves to an array of leave balance data
 */
export async function getCompanyLeaveBalances(companyId: string): Promise<LeaveBalance[]> {
    const endpoint = `${API_DOMAIN}/employee-leaves/balance/company/${encodeURIComponent(companyId)}`;

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
        throw new Error('Failed to fetch company leave balances');
    }

    return data as LeaveBalance[];
}
