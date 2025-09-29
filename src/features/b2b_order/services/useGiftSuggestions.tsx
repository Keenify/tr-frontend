import { BACKEND_API_DOMAIN } from '../../../config';
import { CompanyData } from '../../../shared/types/companyType';

export interface GiftSuggestionParams {
  pax: number;
  budgetPerPerson: number;
  dietaryRestriction: 'halal' | 'non-halal';
  specialInstructions?: string;
  companyInfo: CompanyData;
}

export interface GiftBoxOption {
  name: string;
  basePrice: number;
  actualPrice: number;
  totalPrice: number;
  flavors: string[];
  products: {
    [key: string]: {
      flavors: string[];
      count: number;
      unitCost: number;
    };
  };
  budgetMessage?: string;
}

export const generateGiftSuggestions = async (params: GiftSuggestionParams): Promise<GiftBoxOption[]> => {
  console.log('Backend API Domain:', BACKEND_API_DOMAIN);
  const url = `${BACKEND_API_DOMAIN}/gift-suggestions/generate`;
  console.log('Calling backend URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error(`Failed to generate gift suggestions: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export interface GiftSuggestionPDFData {
  selectedProducts: number[];
  selectedFlavors: {
    [key: string]: string[];
  };
  products: Array<{
    id: number;
    name: string;
    variants: Array<{
      id: number;
      name: string;
      image_url: string | null;
    }>;
  }>;
  companyInfo: CompanyData;
  customerCompanyName: string;
  sales_account_manager: string;
  currentDate: string;
  currency: 'SGD' | 'MYR';
  giftBoxConfiguration: {
    name: string;
    description: string;
    selectedProducts: {
      [productId: number]: {
        name: string;
        selectedVariants: string[];
      };
    };
  };
  specialInstructions?: string;
  pax: number;
  budgetPerPerson: number;
  totalPrice: number;
  pricePerBox: number;
}

export const generateGiftSuggestionPDF = async (data: GiftSuggestionPDFData): Promise<Blob> => {
  // Use the same quotation PDF endpoint as the existing quotation system
  const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error(`Failed to generate gift suggestion PDF: ${response.status} - ${errorText}`);
  }

  return response.blob();
};

// Legacy function - to be removed
export const generateB2BOrderPDF = async (data: any): Promise<Blob> => {
  throw new Error('B2B Order PDF generation has been deprecated. Use gift suggestions instead.');
};