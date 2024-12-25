// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new document.
 * @param {string} title - The title of the document.
 * @param {string} status - The status of the document.
 * @param {string} employeeId - The ID of the employee.
 * @returns {Promise<any>} - A promise that resolves to the created document data.
 */
export async function createDocument(title: string, status: string, employeeId: string): Promise<any> {
    const endpoint = `${API_DOMAIN}/documents/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            status,
            employee_id: employeeId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create document');
    }

    return data;
}

/**
 * Creates a new document tab.
 * @param {string} documentId - The ID of the document.
 * @param {string} title - The title of the tab.
 * @param {number} position - The position of the tab.
 * @returns {Promise<any>} - A promise that resolves to the created tab data.
 */
export async function createDocumentTab(documentId: string, title: string, position: number): Promise<any> {
    const endpoint = `${API_DOMAIN}/documents/${documentId}/tabs/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            position,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create document tab');
    }

    return data;
}
