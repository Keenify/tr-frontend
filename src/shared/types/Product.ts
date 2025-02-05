export interface Product {
    name: string;
    description: string | null;
    pack_count_per_box: number;
    recommended_retail_price: string;
    id: number;
    company_id: string;
    created_at: string;
}

export interface ProductVariant {
    name: string;
    image_url: string | null;
    product_barcode?: string;
    carton_barcode?: string;
    id: number;
    product_id: number;
    created_at: string;
}

export interface ProductPriceTier {
    min_cartons: number | null;
    min_packs: number;
    price_per_unit: string;
    id: number;
    product_id: number;
    created_at: string;
}

export interface CreateProductRequest {
    name: string;
    description?: string;
    pack_count_per_box: number;
    recommended_retail_price: number;
    company_id: string;
}

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    pack_count_per_box?: number;
    recommended_retail_price?: number;
}

export interface CreateProductVariantRequest {
    name: string;
    image?: File;
    product_id: number;
} 

export interface UpdateProductVariantRequest {
    name?: string;
    image?: File;
    product_barcode?: string;
    carton_barcode?: string;
}

export interface DeleteProductVariantRequest {
    variant_id: number;
}