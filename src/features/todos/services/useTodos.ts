import { CreateTodoPayload, TodoData, UpdateTodoPayload } from '../types/todo';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new todo
 * @param {CreateTodoPayload} payload - The todo data to create
 * @returns {Promise<TodoData>} - A promise that resolves to the created todo data
 */
export async function createTodo(payload: CreateTodoPayload): Promise<TodoData> {
    const endpoint = `${API_DOMAIN}/todos/`;

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
        throw new Error('Failed to create todo');
    }

    return data as TodoData;
}

/**
 * Fetches a specific todo by ID
 * @param {string} todoId - The ID of the todo
 * @returns {Promise<TodoData>} - A promise that resolves to the todo data
 */
export async function getTodo(todoId: string): Promise<TodoData> {
    const endpoint = `${API_DOMAIN}/todos/${encodeURIComponent(todoId)}`;

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
        throw new Error('Failed to fetch todo');
    }

    return data as TodoData;
}

/**
 * Updates an existing todo
 * @param {string} todoId - The ID of the todo to update
 * @param {UpdateTodoPayload} payload - The todo data to update
 * @returns {Promise<TodoData>} - A promise that resolves to the updated todo data
 */
export async function updateTodo(
    todoId: string,
    payload: UpdateTodoPayload
): Promise<TodoData> {
    const endpoint = `${API_DOMAIN}/todos/${encodeURIComponent(todoId)}`;

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
        throw new Error('Failed to update todo');
    }

    return data as TodoData;
}

/**
 * Fetches todos for a specific company
 * @param {string} companyId - The ID of the company
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<TodoData[]>} - A promise that resolves to an array of todo data
 */
export async function getCompanyTodos(
    companyId: string,
    skip: number = 0,
    limit: number = 100
): Promise<TodoData[]> {
    const endpoint = `${API_DOMAIN}/todos/company/${encodeURIComponent(companyId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch company todos');
    }

    return data as TodoData[];
}

/**
 * Fetches todos for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<TodoData[]>} - A promise that resolves to an array of todo data
 */
export async function getEmployeeTodos(
    employeeId: string,
    skip: number = 0,
    limit: number = 100
): Promise<TodoData[]> {
    const endpoint = `${API_DOMAIN}/todos/employee/${encodeURIComponent(employeeId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch employee todos');
    }

    return data as TodoData[];
}

/**
 * Deletes a todo
 * @param {string} todoId - The ID of the todo to delete
 * @returns {Promise<TodoData>} - A promise that resolves to the deleted todo data
 */
export async function deleteTodo(todoId: string): Promise<TodoData> {
    const endpoint = `${API_DOMAIN}/todos/${encodeURIComponent(todoId)}`;

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
        throw new Error('Failed to delete todo');
    }

    return data as TodoData;
}
