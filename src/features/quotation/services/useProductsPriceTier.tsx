import { ProductPriceTier } from '../../../shared/types/Product'; // Import the ProductPriceTier type
import { BACKEND_API_DOMAIN } from '../../../config'; // Import the BACKEND_API_DOMAIN

export const getProductPriceTiers = async (productId: string): Promise<ProductPriceTier[]> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/${productId}/price-tiers`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch product price tiers');
    }

    return response.json();
};

export const createPriceTier = async (minCartons: number, pricePerUnit: number, productId: number): Promise<ProductPriceTier> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/price-tiers/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            min_cartons: minCartons,
            price_per_unit: pricePerUnit,
            product_id: productId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create price tier');
    }

    return response.json();
};

export const updatePriceTier = async (priceTierId: number, minCartons: number, pricePerUnit: number): Promise<ProductPriceTier> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/price-tiers/${priceTierId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            min_cartons: minCartons,
            price_per_unit: pricePerUnit,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update price tier');
    }

    return response.json();
};

export const deletePriceTier = async (priceTierId: number): Promise<boolean> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/price-tiers/${priceTierId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete price tier');
    }

    return response.ok;
};
