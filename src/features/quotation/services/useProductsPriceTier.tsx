import { CreateProductPriceTierRequest, ProductPriceTier } from '../../../shared/types/Product'; // Import the ProductPriceTier type
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

export const createPriceTier = async (
    minCartons: number, 
    minPacks: number, 
    pricePerUnit: number, 
    productId: number,
    currency: 'SGD' | 'MYR'
): Promise<CreateProductPriceTierRequest> => {
    // Check if both minCartons and minPacks are greater than 0
    if (minCartons > 0 && minPacks > 0) {
        alert('minCartons and minPacks cannot both be greater than 0 at the same time.');
        throw new Error('Invalid input: minCartons and minPacks cannot both be greater than 0.');
    }

    console.log('Creating price tier:', { minCartons, minPacks, pricePerUnit, productId });
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/price-tiers/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            min_cartons: minCartons,
            min_packs: minPacks,
            price_per_unit: pricePerUnit,
            product_id: productId,
            currency: currency,
        }),
    });

    if (!response.ok) {
        console.error('Failed to create price tier:', response.statusText);
        throw new Error('Failed to create price tier');
    }

    const result = await response.json();
    console.log('Created price tier:', result);
    return result;
};

export const updatePriceTier = async (
    priceTierId: number, 
    minCartons: number, 
    minPacks: number, 
    pricePerUnit: number,
    currency: 'SGD' | 'MYR'
): Promise<ProductPriceTier> => {
    console.log('Updating price tier:', { priceTierId, minCartons, minPacks, pricePerUnit });
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/price-tiers/${priceTierId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            min_cartons: minCartons,
            min_packs: minPacks,
            price_per_unit: pricePerUnit,
            currency: currency,
        }),
    });

    if (!response.ok) {
        console.error('Failed to update price tier:', response.statusText);
        throw new Error('Failed to update price tier');
    }

    const result = await response.json();
    console.log('Updated price tier:', result);
    return result;
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
