import { CompanyData } from '../../../shared/types/companyType';
import { Product, ProductPriceTier } from '../../../shared/types/Product';

export interface GiftBoxItem {
  id: string;
  productId: number;
  quantity: number;
  selectedFlavors: string[];
}

export interface GiftBoxConfiguration {
  name: string;
  description: string;
  selectedProducts: {
    [productId: number]: {
      name: string;
      selectedVariants: string[];
    };
  };
}

export interface QuotationPDFData {
  selectedProducts: number[];
  selectedFlavors: {
    [key: string]: string[];
  };
  products: (Product & {
    variants: Array<{
      id: number;
      name: string;
      image_url: string | null;
    }>;
    priceTiers: ProductPriceTier[];
  })[];
  companyInfo: CompanyData;
  customerCompanyName: string;
  sales_account_manager: string;
  currentDate: string;
  currency: 'SGD' | 'MYR';
  tableSettings: {
    showPackCount: boolean;
    showRetailPrice: boolean;
    visibleCartonColumns: number[];
    displayType: 'pack' | 'carton';
  };
  footer: string;
  giftBoxConfiguration?: GiftBoxConfiguration;
  giftBoxItems?: GiftBoxItem[];
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
        product_barcode?: string | null;
        shelf_life?: string;
        hs_code?: string;
        carton_width?: string;
        carton_length?: string;
        carton_height?: string;
        net_weight?: string;
        gross_weight?: string;
        country_of_origin?: string;
        variants: {
            description: string;
            variant_id: number;
        }[];
    }[];
    companyInfo: CompanyData;
    customerCompanyName: string;
    currentDate: string;
    sales_account_manager: string;
    tableSettings?: {
        showFOBPricePerUnit: boolean;
        showCartonBarcode?: boolean;
        currency?: 'USD' | 'SGD';
        showProductBarcode?: boolean;
        showShelfLife?: boolean;
        showHsCode?: boolean;
        showCartonDimensions?: boolean;
        showNetWeight?: boolean;
        showGrossWeight?: boolean;
        showCountryOfOrigin?: boolean;
    };
}