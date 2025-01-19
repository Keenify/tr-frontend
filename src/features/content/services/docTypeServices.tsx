import axios from 'axios';
import { DocumentType } from '../types/documentType';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

export const documentTypeService = {
  /**
   * Fetch document types for a specific company
   * @param companyId - The ID of the company
   * @returns Promise<DocumentType[]> - Array of document types
   */
  async getDocumentTypes(companyId: string): Promise<DocumentType[]> {
    try {
      const response = await axios.get<DocumentType[]>(
        `${API_DOMAIN}/document-types/`,
        {
          params: {
            company_id: companyId,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  },
};