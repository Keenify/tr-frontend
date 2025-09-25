import { BACKEND_API_DOMAIN } from '../../../config';
import { B2BOrderRow } from '../types/B2BOrderTypes';
import { CompanyData } from '../../../shared/types/companyType';

export interface B2BOrderPDFData {
  rows: B2BOrderRow[];
  companyInfo: CompanyData;
  customerCompanyName?: string;
  currentDate: string;
  totalPax: number;
  totalAmount: number;
}

export const generateB2BOrderPDF = async (data: B2BOrderPDFData): Promise<Blob> => {
  console.log('Backend API Domain:', BACKEND_API_DOMAIN);
  const url = `${BACKEND_API_DOMAIN}/quotations/generate-b2b-order`;
  console.log('Calling backend URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', errorText);
    throw new Error(`Failed to generate B2B Order PDF: ${response.status} - ${errorText}`);
  }

  return response.blob();
};