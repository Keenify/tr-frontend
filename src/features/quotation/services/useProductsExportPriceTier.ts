import { BACKEND_API_DOMAIN } from '../../../config';

// Types
export interface ProductExportPriceTier {
    id: number;
    tier_name: string;
    fob_price_per_carton: number;
    fob_price_per_unit: number;
    recommended_rrp: number;
    pack_per_carton: number;
    is_active: boolean;
    product_id: number;
    created_at: string;
    updated_at: string;
}

export interface CreateProductExportPriceTierRequest {
    tier_name: string;
    fob_price_per_carton: number;
    fob_price_per_unit: number;
    recommended_rrp: number;
    is_active: boolean;
    product_id: number;
}

// Get product export price tiers for a specific product
export const getProductExportPriceTiers = async (productId: number): Promise<ProductExportPriceTier[]> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/product-export-price-tiers/product/${productId}?skip=0&limit=100`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch product export price tiers');
    }

    return response.json();
};

// Create a new export price tier
export const createExportPriceTier = async (
    tierName: string,
    fobPricePerCarton: number,
    fobPricePerUnit: number,
    recommendedRrp: number,
    packPerCarton: number,
    isActive: boolean,
    productId: number,
): Promise<ProductExportPriceTier> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/product-export-price-tiers/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tier_name: tierName,
            fob_price_per_carton: fobPricePerCarton,
            fob_price_per_unit: fobPricePerUnit,
            recommended_rrp: recommendedRrp,
            pack_per_carton: packPerCarton,
            is_active: isActive,
            product_id: productId,
        }),
    });

    if (!response.ok) {
        console.error('Failed to create export price tier:', response.statusText);
        throw new Error('Failed to create export price tier');
    }

    const result = await response.json();
    console.log('Created export price tier:', result);
    return result;
};

// Update an existing export price tier
export const updateExportPriceTier = async (
    priceTierId: number,
    tierName: string,
    fobPricePerCarton: number,
    fobPricePerUnit: number,
    recommendedRrp: number,
    packPerCarton: number,
    isActive: boolean,
): Promise<ProductExportPriceTier> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/product-export-price-tiers/${priceTierId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tier_name: tierName,
            fob_price_per_carton: fobPricePerCarton,
            fob_price_per_unit: fobPricePerUnit,
            recommended_rrp: recommendedRrp,
            pack_per_carton: packPerCarton,
            is_active: isActive,
        }),
    });

    if (!response.ok) {
        console.error('Failed to update export price tier:', response.statusText);
        throw new Error('Failed to update export price tier');
    }

    const result = await response.json();
    console.log('Updated export price tier:', result);
    return result;
};

// Delete an export price tier
export const deleteExportPriceTier = async (priceTierId: number): Promise<ProductExportPriceTier> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/product-export-price-tiers/${priceTierId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete export price tier');
    }

    return response.json();
};
