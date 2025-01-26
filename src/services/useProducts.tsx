import { Product } from '../shared/types/Product'; // Import the Product type
import { BACKEND_API_DOMAIN } from '../config'; // Import the BACKEND_API_DOMAIN
import { CreateProductRequest, UpdateProductRequest } from '../shared/types/Product'; // Import the CreateProductRequest and UpdateProductRequest types

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

export const createProduct = async (product: CreateProductRequest): Promise<Product> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });

    if (!response.ok) {
        throw new Error('Failed to create product');
    }

    return response.json();
};

export const updateProduct = async (productId: number, updates: UpdateProductRequest): Promise<Product> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error('Failed to update product');
    }

    return response.json();
};

export const deleteProduct = async (productId: number): Promise<boolean> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete product');
    }

    return true;
};


