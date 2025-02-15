// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Types for mind map data structure
export interface MindMapNode {
    id: string;
    type: string;
    data: {
        label: string;
        description: string;
    };
    position: {
        x: number;
        y: number;
    };
    parentNode?: string;
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    type: string;
}

export interface MindMapData {
    title: string;
    description: string;
    nodes: MindMapNode[];
    edges: MindMapEdge[];
}

export interface CreateMindMapRequest {
    title: string;
    description: string;
    mindmap: MindMapData;
    company_id: string;
    created_by: string;
}

export interface MindMapResponse extends CreateMindMapRequest {
    id: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateMindMapRequest {
    title?: string;
    description?: string;
    mindmap?: Partial<MindMapData>;
}

interface PaginationParams {
    skip?: number;
    limit?: number;
}

/**
 * Creates a new mind map.
 * @param {CreateMindMapRequest} mindMapData - The mind map data to create.
 * @returns {Promise<MindMapResponse>} - A promise that resolves to the created mind map data.
 */
export async function createMindMap(mindMapData: CreateMindMapRequest): Promise<MindMapResponse> {
    const endpoint = `${API_DOMAIN}/mindmaps/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mindMapData)
    });
    console.log('🚀 ~ createMindMap ~ endpoint:', endpoint);
    console.log('🚀 ~ createMindMap ~ body:', JSON.stringify(mindMapData));
    console.log('🚀 ~ createMindMap ~ response:', response);

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to create mind map');
    }

    return data as MindMapResponse;
}

/**
 * Fetches a mind map by its ID.
 * @param {string} mindMapId - The ID of the mind map to retrieve.
 * @returns {Promise<MindMapResponse>} - A promise that resolves to the mind map data.
 */
export async function getMindMap(mindMapId: string): Promise<MindMapResponse> {
    const endpoint = `${API_DOMAIN}/mindmaps/${encodeURIComponent(mindMapId)}`;

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
        throw new Error('Failed to fetch mind map');
    }

    return data as MindMapResponse;
}

/**
 * Updates an existing mind map. Supports partial updates.
 * @param {string} mindMapId - The ID of the mind map to update.
 * @param {UpdateMindMapRequest} mindMapData - The fields to update. All fields are optional.
 * @returns {Promise<MindMapResponse>} - A promise that resolves to the updated mind map data.
 */
export async function updateMindMap(
    mindMapId: string, 
    mindMapData: UpdateMindMapRequest
): Promise<MindMapResponse> {
    const endpoint = `${API_DOMAIN}/mindmaps/${encodeURIComponent(mindMapId)}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mindMapData)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            data
        });
        throw new Error('Failed to update mind map');
    }

    return data as MindMapResponse;
}

/**
 * Fetches all mind maps for a specific company with pagination support.
 * @param {string} companyId - The ID of the company.
 * @param {PaginationParams} pagination - Optional pagination parameters.
 * @param {number} pagination.skip - Number of records to skip (default: 0).
 * @param {number} pagination.limit - Maximum number of records to return (default: 100).
 * @returns {Promise<MindMapResponse[]>} - A promise that resolves to an array of mind maps.
 */
export async function getCompanyMindMaps(
    companyId: string,
    pagination: PaginationParams = { skip: 0, limit: 100 }
): Promise<MindMapResponse[]> {
    const { skip = 0, limit = 100 } = pagination;
    const endpoint = `${API_DOMAIN}/mindmaps/company/${encodeURIComponent(companyId)}?skip=${skip}&limit=${limit}`;

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
        throw new Error('Failed to fetch company mind maps');
    }

    return data as MindMapResponse[];
}

/**
 * Deletes a mind map by its ID.
 * @param {string} mindMapId - The ID of the mind map to delete.
 * @returns {Promise<MindMapResponse>} - A promise that resolves to the deleted mind map data.
 */
export async function deleteMindMap(mindMapId: string): Promise<MindMapResponse> {
    const endpoint = `${API_DOMAIN}/mindmaps/${encodeURIComponent(mindMapId)}`;

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
        throw new Error('Failed to delete mind map');
    }

    return data as MindMapResponse;
}
