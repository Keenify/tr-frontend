import { BACKEND_API_DOMAIN } from '../config';
import { ProductExportDetails, UpdateProductExportDetails, CreateProductExportDetailsRequest, CompanyProductExportDetails, ProductExportSelection } from '../shared/types/ProductExport';
import { ProductVariant } from '../shared/types/Product';

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
 * Incorporates detailed variant information (like COGS) from a separate map.
 * @param data - The raw company product export details from getCompanyProductExportDetails
 * @param variantsMap - A Map where the key is product_id and the value is an array of full ProductVariant details for that product
 * @returns Array of product export selections with computed values
 */
export const transformToSelectableFormat = (
    data: CompanyProductExportDetails[],
    variantsMap: Map<number, ProductVariant[]>
): ProductExportSelection[] => {
    return data.map(product => {
        const defaultVariant = product.details.length > 0 ? product.details[0] : null;
        const defaultFobCarton = defaultVariant ? parseFloat(defaultVariant.fob_price_per_carton) : 0;
        const defaultPackSize = defaultVariant ? defaultVariant.pack_size_per_carton : 1;
        const defaultFobUnit = defaultPackSize > 0 ? defaultFobCarton / defaultPackSize : 0;
        const defaultRrp = defaultVariant ? parseFloat(defaultVariant.recommended_retail_price_usd) : 0;

        // Get the detailed variants for this product from the map
        const detailedVariants = variantsMap.get(product.product_id) || [];

        return {
            product_id: product.product_id,
            product_name: product.product_name,
            isSelected: false,
            variants: product.details.map(variantExportInfo => {
                // Find the corresponding full variant detail using variant_id
                const fullVariantDetail = detailedVariants.find(v => v.id === variantExportInfo.variant_id);

                // Calculate FOB per unit
                const fobPerCarton = parseFloat(variantExportInfo.fob_price_per_carton);
                const packSize = variantExportInfo.pack_size_per_carton || 1;
                const fobPerUnit = isNaN(fobPerCarton) || packSize <= 0 ? 0 : fobPerCarton / packSize;

                return {
                    variant_id: variantExportInfo.variant_id,
                    description: variantExportInfo.product_description,
                    isSelected: false,
                    pack_size_per_carton: packSize,
                    fob_price_per_carton: isNaN(fobPerCarton) ? 0 : fobPerCarton, // Use parsed value, default to 0 if NaN
                    fob_price_per_unit: fobPerUnit,
                    recommended_retail_price_usd: variantExportInfo.recommended_retail_price_usd,
                    container_size: variantExportInfo.container_size,
                    cartons_per_container: variantExportInfo.cartons_per_container,
                    barcode: variantExportInfo.carton_barcode ?? variantExportInfo.product_barcode ?? null,
                    // Get COGS from the full variant detail, default to '0' if not found
                    cost_of_goods_sold: fullVariantDetail?.cost_of_goods_sold ?? '0'
                };
            }),
            applied_fob_price_per_carton: defaultFobCarton,
            applied_fob_price_per_unit: defaultFobUnit,
            applied_recommended_rrp: defaultRrp,
        };
    });
};
