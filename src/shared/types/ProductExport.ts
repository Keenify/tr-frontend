interface BaseProductExportDetails {
    pack_size_per_carton: number;
    fob_price_per_carton: string;
    recommended_retail_price_usd: string;
    shelf_life: string;
    hs_code: string;
    carton_width: string;
    carton_length: string;
    carton_height: string;
    net_weight: string;
    gross_weight: string;
    country_of_origin: string;
    container_size: string;
    cartons_per_container: number;
    barcode: string | null;
}

export interface ProductExportDetails extends BaseProductExportDetails {
    id: number;
    product_id: number;
    created_at: string;
}

export type UpdateProductExportDetails = BaseProductExportDetails;

export interface CreateProductExportDetailsRequest extends BaseProductExportDetails {
    product_id: number;
}


// For Quotation > Export
export interface ProductVariantExportDetails extends BaseProductExportDetails {
    variant_id: number;
    product_description: string;
    product_barcode: string | null;
    carton_barcode: string | null;
    image_url: string;
}

export interface CompanyProductExportDetails {
    product_id: number;
    product_name: string;
    export_info_id: number;
    details: ProductVariantExportDetails[];
}

export interface ProductExportSelection {
    product_id: number;
    product_name: string;
    isSelected: boolean;
    variants: {
        variant_id: number;
        description: string;
        isSelected: boolean;
        pack_size_per_carton: number;
        fob_price_per_carton: number;
        fob_price_per_unit: number;
        recommended_retail_price_usd: string;
        container_size: string;
        cartons_per_container: number;
        barcode: string | null;
    }[];
}