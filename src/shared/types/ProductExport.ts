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
}

export interface ProductExportDetails extends BaseProductExportDetails {
    id: number;
    product_id: number;
    created_at: string;
}

export interface UpdateProductExportDetails extends BaseProductExportDetails {}

export interface CreateProductExportDetailsRequest extends BaseProductExportDetails {
    product_id: number;
}