import { 
    CreateTodoPayload, 
    TodoData, 
    UpdateTodoPayload, 
    TabData, 
    CreateTabPayload, 
    UpdateTabPayload,
    SectionData,
    CreateSectionPayload,
    UpdateSectionPayload
} from '../types/todo';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Error handling helper function
const handleApiError = (response: Response, data: unknown, errorMessage: string): never => {
    console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        data
    });
    throw new Error(errorMessage);
};

/**
 * Creates a new todo
 * @param {CreateTodoPayload} payload - The todo data to create
 * @returns {Promise<TodoData>} - A promise that resolves to the created todo data
 */
export async function createTodo(payload: CreateTodoPayload): Promise<TodoData> {
    const endpoint = `${API_DOMAIN}/todos/`;

    // Add default value for is_completed if not provided
    const todoPayload = {
        ...payload,
        is_completed: payload.is_completed ?? false
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoPayload),
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to create todo');
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
        return handleApiError(response, data, 'Failed to fetch todo');
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
        return handleApiError(response, data, 'Failed to update todo');
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
        return handleApiError(response, data, 'Failed to fetch company todos');
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
        return handleApiError(response, data, 'Failed to fetch employee todos');
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
        return handleApiError(response, data, 'Failed to delete todo');
    }

    return data as TodoData;
}

/**
 * Creates a new tab
 * @param {CreateTabPayload} payload - The tab data to create
 * @returns {Promise<TabData>} - A promise that resolves to the created tab data
 */
export async function createTab(payload: CreateTabPayload): Promise<TabData> {
    const endpoint = `${API_DOMAIN}/todos/tabs`;

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
        return handleApiError(response, data, 'Failed to create tab');
    }

    return data as TabData;
}

/**
 * Fetches a specific tab by ID
 * @param {string} tabId - The ID of the tab
 * @returns {Promise<TabData>} - A promise that resolves to the tab data
 */
export async function getTab(tabId: string): Promise<TabData> {
    const endpoint = `${API_DOMAIN}/todos/tabs/${encodeURIComponent(tabId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch tab');
    }

    return data as TabData;
}

/**
 * Updates an existing tab
 * @param {string} tabId - The ID of the tab to update
 * @param {UpdateTabPayload} payload - The tab data to update
 * @returns {Promise<TabData>} - A promise that resolves to the updated tab data
 */
export async function updateTab(
    tabId: string,
    payload: UpdateTabPayload
): Promise<TabData> {
    const endpoint = `${API_DOMAIN}/todos/tabs/${encodeURIComponent(tabId)}`;

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
        return handleApiError(response, data, 'Failed to update tab');
    }

    return data as TabData;
}

/**
 * Deletes a tab
 * @param {string} tabId - The ID of the tab to delete
 * @returns {Promise<TabData>} - A promise that resolves to the deleted tab data
 */
export async function deleteTab(tabId: string): Promise<TabData> {
    const endpoint = `${API_DOMAIN}/todos/tabs/${encodeURIComponent(tabId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to delete tab');
    }

    return data as TabData;
}

/**
 * Fetches tabs for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<TabData[]>} - A promise that resolves to an array of tab data
 */
export async function getEmployeeTabs(employeeId: string): Promise<TabData[]> {
    const endpoint = `${API_DOMAIN}/todos/tabs/employee/${encodeURIComponent(employeeId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch employee tabs');
    }

    return data as TabData[];
}

/**
 * Creates a new section
 * @param {CreateSectionPayload} payload - The section data to create
 * @returns {Promise<SectionData>} - A promise that resolves to the created section data
 */
export async function createSection(payload: CreateSectionPayload): Promise<SectionData> {
    const endpoint = `${API_DOMAIN}/todos/sections`;

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
        return handleApiError(response, data, 'Failed to create section');
    }

    return data as SectionData;
}

/**
 * Fetches a specific section by ID
 * @param {string} sectionId - The ID of the section
 * @returns {Promise<SectionData>} - A promise that resolves to the section data
 */
export async function getSection(sectionId: string): Promise<SectionData> {
    const endpoint = `${API_DOMAIN}/todos/sections/${encodeURIComponent(sectionId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch section');
    }

    return data as SectionData;
}

/**
 * Updates an existing section
 * @param {string} sectionId - The ID of the section to update
 * @param {UpdateSectionPayload} payload - The section data to update
 * @returns {Promise<SectionData>} - A promise that resolves to the updated section data
 */
export async function updateSection(
    sectionId: string,
    payload: UpdateSectionPayload
): Promise<SectionData> {
    const endpoint = `${API_DOMAIN}/todos/sections/${encodeURIComponent(sectionId)}`;

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
        return handleApiError(response, data, 'Failed to update section');
    }

    return data as SectionData;
}

/**
 * Deletes a section
 * @param {string} sectionId - The ID of the section to delete
 * @returns {Promise<SectionData>} - A promise that resolves to the deleted section data
 */
export async function deleteSection(sectionId: string): Promise<SectionData> {
    const endpoint = `${API_DOMAIN}/todos/sections/${encodeURIComponent(sectionId)}`;

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to delete section');
    }

    return data as SectionData;
}

/**
 * Fetches sections for a specific tab
 * @param {string} tabId - The ID of the tab
 * @returns {Promise<SectionData[]>} - A promise that resolves to an array of section data
 */
export async function getTabSections(tabId: string): Promise<SectionData[]> {
    const endpoint = `${API_DOMAIN}/todos/sections/tab/${encodeURIComponent(tabId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch tab sections');
    }

    return data as SectionData[];
}

/**
 * Fetches todos for a specific section
 * @param {string} sectionId - The ID of the section
 * @returns {Promise<TodoData[]>} - A promise that resolves to an array of todo data
 */
export async function getSectionTodos(sectionId: string): Promise<TodoData[]> {
    const endpoint = `${API_DOMAIN}/todos/section/${encodeURIComponent(sectionId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch section todos');
    }

    return data as TodoData[];
}

/**
 * Fetches sections for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<SectionData[]>} - A promise that resolves to an array of section data
 */
export async function getEmployeeSections(employeeId: string): Promise<SectionData[]> {
    const endpoint = `${API_DOMAIN}/todos/sections/employee/${encodeURIComponent(employeeId)}`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        return handleApiError(response, data, 'Failed to fetch employee sections');
    }

    return data as SectionData[];
}
