import { ProductVariant } from '../shared/types/Product'; // Import the Product type
import { BACKEND_API_DOMAIN } from '../config'; // Import the BACKEND_API_DOMAIN
import { CreateProductVariantRequest, UpdateProductVariantRequest } from '../shared/types/Product'; 

export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/${productId}/variants`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch product variants');
    }

    return response.json();
};

export const createProductVariant = async (data: CreateProductVariantRequest): Promise<ProductVariant> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.image) {
        formData.append('image', data.image);
    }

    const response = await fetch(`${BACKEND_API_DOMAIN}/products/variants/?name=${encodeURIComponent(data.name)}&product_id=${data.product_id}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to create product variant');
    }

    return response.json();
};


export const updateProductVariant = async (
    variantId: number, 
    data: UpdateProductVariantRequest
): Promise<ProductVariant> => {
    const formData = new FormData();
    if (data.image) {
        formData.append('image', data.image);
    }

    const url = new URL(`${BACKEND_API_DOMAIN}/products/variants/${variantId}`);
    if (data.name) {
        url.searchParams.append('name', data.name);
    }

    const response = await fetch(url.toString(), {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to update product variant');
    }

    return response.json();
};

export const deleteProductVariant = async (variantId: number): Promise<boolean> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/products/variants/${variantId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete product variant');
    }

    return response.json();
};