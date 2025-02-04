import { BACKEND_API_DOMAIN } from '../config';
import { ProductExportDetails, UpdateProductExportDetails, CreateProductExportDetailsRequest} from '../shared/types/ProductExport';

/**
 * Fetches export details for a specific product from the backend
 * @param productId - The ID of the product to fetch export details for
 * @returns Promise containing the product export details
 * @throws Error if the API request fails
 */
export const getProductExportDetails = async (productId: number): Promise<ProductExportDetails> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/export-info/product/${productId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch product export details');
    }

    return response.json();
};

/**
 * Updates existing product export details
 * @param exportInfoId - The ID of the export info record to update
 * @param data - The updated export details data
 * @returns Promise containing the updated product export details
 * @throws Error if the API request fails
 */
export const updateProductExportDetails = async (
    exportInfoId: number, 
    data: UpdateProductExportDetails
): Promise<ProductExportDetails> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/export-info/${exportInfoId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update product export details');
    }

    return response.json();
};

/**
 * Deletes product export details
 * @param exportInfoId - The ID of the export info record to delete
 * @returns Promise containing a boolean indicating success
 * @throws Error if the API request fails
 */
export const deleteProductExportDetails = async (exportInfoId: number): Promise<boolean> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/export-info/${exportInfoId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete product export details');
    }

    return response.json();
};

/**
 * Creates new product export details
 * @param data - The product export details to create
 * @returns Promise containing the newly created product export details
 * @throws Error if the API request fails
 */
export const createProductExportDetails = async (
    data: CreateProductExportDetailsRequest
): Promise<ProductExportDetails> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/export-info/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create product export details');
    }

    return response.json();
};
