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