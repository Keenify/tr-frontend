import { Product } from '../shared/types/Product'; // Import the Product type
import { BACKEND_API_DOMAIN } from '../config'; // Import the BACKEND_API_DOMAIN

export const getProductsByCompany = async (companyId: string): Promise<Product[]> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/company/${companyId}/products`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }

    return response.json();
};


