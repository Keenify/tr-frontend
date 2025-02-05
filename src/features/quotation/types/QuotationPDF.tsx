import { CompanyData } from '../../../shared/types/companyType';
import { Product } from '../../../shared/types/Product';

export interface QuotationPDFData {
    selectedProducts: number[];
    selectedFlavors: { [key: string]: string[] };
    products: Product[];
    companyInfo: CompanyData;
    customerCompanyName: string;
    currentDate: string;
    tableSettings: {
        showPackCount: boolean;
        showRetailPrice: boolean;
        visibleCartonColumns: number[];
    };
    footer: string;
}

export interface QuotationExportPDFData {
    selectedProducts: {
        product_name: string;
        product_id: number;
        container_size: string;
        cartons_per_container: number | string;
        pack_size_per_carton: number | string;
        fob_price_per_carton: number | string;
        recommended_retail_price_usd: number | string;
        variants: {
            description: string;
            variant_id: number;
        }[];
    }[];
    companyInfo: CompanyData;
    customerCompanyName: string;
    currentDate: string;
    sales_account_manager: string;
}