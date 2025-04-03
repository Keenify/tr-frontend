import { BACKEND_API_DOMAIN } from '../config';
import { ProductExportDetails, UpdateProductExportDetails, CreateProductExportDetailsRequest, CompanyProductExportDetails, ProductExportSelection } from '../shared/types/ProductExport';

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

/**
 * Fetches all product export details for a specific company
 * @param companyId - The UUID of the company
 * @returns Promise containing an array of company product export details
 * @throws Error if the API request fails
 */
export const getCompanyProductExportDetails = async (
    companyId: string
): Promise<CompanyProductExportDetails[]> => {
    const response = await fetch(
        `${BACKEND_API_DOMAIN}/products/company/${companyId}/export-details`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch company product export details');
    }

    return response.json();
};

/**
 * Transforms company product export details into a selectable format for the Quotation Export UI.
 * Initializes applied prices based on the first variant.
 * @param data - The raw company product export details
 * @returns Array of product export selections with computed values
 */
export const transformToSelectableFormat = (
    data: CompanyProductExportDetails[]
): ProductExportSelection[] => {
    return data.map(product => {
        const defaultVariant = product.details.length > 0 ? product.details[0] : null;
        const defaultFobCarton = defaultVariant ? parseFloat(defaultVariant.fob_price_per_carton) : 0;
        const defaultPackSize = defaultVariant ? defaultVariant.pack_size_per_carton : 1;
        const defaultFobUnit = defaultPackSize > 0 ? defaultFobCarton / defaultPackSize : 0;
        const defaultRrp = defaultVariant ? parseFloat(defaultVariant.recommended_retail_price_usd) : 0;

        return {
            product_id: product.product_id,
            product_name: product.product_name,
            isSelected: false,
            variants: product.details.map(variant => ({
                variant_id: variant.variant_id,
                description: variant.product_description,
                isSelected: false,
                pack_size_per_carton: variant.pack_size_per_carton,
                fob_price_per_carton: parseFloat(variant.fob_price_per_carton),
                fob_price_per_unit: parseFloat(variant.fob_price_per_carton) / (variant.pack_size_per_carton || 1),
                recommended_retail_price_usd: variant.recommended_retail_price_usd,
                container_size: variant.container_size,
                cartons_per_container: variant.cartons_per_container,
                barcode: variant.carton_barcode ?? variant.product_barcode ?? null
            })),
            applied_fob_price_per_carton: defaultFobCarton,
            applied_fob_price_per_unit: defaultFobUnit,
            applied_recommended_rrp: defaultRrp,
        };
    });
};
