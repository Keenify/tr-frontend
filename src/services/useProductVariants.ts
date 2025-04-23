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

    const url = new URL(`${BACKEND_API_DOMAIN}/products/variants/`);
    url.searchParams.append('name', encodeURIComponent(data.name));
    url.searchParams.append('product_id', data.product_id.toString());
    
    // Add barcode parameters if they exist
    if (data.product_barcode) {
        url.searchParams.append('product_barcode', data.product_barcode);
    }
    
    if (data.carton_barcode) {
        url.searchParams.append('carton_barcode', data.carton_barcode);
    }

    // Add cost of goods sold
    url.searchParams.append('cost_of_goods_sold', data.cost_of_goods_sold);

    const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
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
    
    // Add product_barcode and carton_barcode to URL parameters
    if (data.product_barcode !== undefined) {
        url.searchParams.append('product_barcode', data.product_barcode);
    }
    
    if (data.carton_barcode !== undefined) {
        url.searchParams.append('carton_barcode', data.carton_barcode);
    }

    // Add cost of goods sold if provided
    if (data.cost_of_goods_sold !== undefined) {
        url.searchParams.append('cost_of_goods_sold', data.cost_of_goods_sold);
    }

    const response = await fetch(url.toString(), {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
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