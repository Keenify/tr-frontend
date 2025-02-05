import { BACKEND_API_DOMAIN } from '../../../config';
import { QuotationExportPDFData, QuotationPDFData } from '../types/QuotationPDF';

export const generateQuotationPDF = async (data: QuotationPDFData): Promise<Blob> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate`, {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to generate quotation PDF');
    }

    return response.blob();
};

export const generateQuotationExportPDF = async (data: QuotationExportPDFData): Promise<Blob> => {
    const response = await fetch(`${BACKEND_API_DOMAIN}/quotations/generate-export-quotation`, {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to generate export quotation PDF');
    }

    return response.blob();
}; 

