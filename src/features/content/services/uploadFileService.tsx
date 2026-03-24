import axios from 'axios';
import { getPublicUrl } from '../../../services/storageService';

interface UploadResponse {
  file_name: string;
  file_size: number;
  file_type: string;
  description: string | null;
  type: 'Company' | 'Policies' | 'Processes';
  status: 'draft' | 'published';
  title: string;
  employee_id: string;
  company_id: string;
  id: string;
  file_path: string;
  document_id: string | null;
  upload_date: string;
}

interface UploadFileParams {
  file: File;
  title: string;
  documentType: string;
  employeeId: string;
  companyId: string;
  onProgress?: (progress: number) => void;
}

/**
 * Uploads a document file to the server
 * 
 * @param {UploadFileParams} params - The parameters for uploading a file
 * @returns {Promise<UploadResponse>} The server response containing the uploaded file details
 * @throws {Error} When the upload fails
 */
export const uploadFile = async ({
  file,
  title,
  documentType,
  employeeId,
  companyId,
  onProgress
}: UploadFileParams): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResponse>(
      `${import.meta.env.VITE_BACKEND_API_DOMAIN}/upload_documents/upload/`,
      formData,
      {
        params: {
          employee_id: employeeId,
          company_id: companyId,
          title: title,
          document_type: documentType,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Fetches all uploaded documents for a specific company
 * 
 * @param {string} companyId - The ID of the company to fetch documents for
 * @returns {Promise<UploadResponse[]>} Array of uploaded documents
 * @throws {Error} When the fetch operation fails
 */
export const fetchCompanyDocuments = async (companyId: string): Promise<UploadResponse[]> => {
  try {
    const response = await axios.get<UploadResponse[]>(
      `${import.meta.env.VITE_BACKEND_API_DOMAIN}/upload_documents/company/${companyId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching company documents:', error);
    throw error;
  }
};

/**
 * Gets a signed URL for a file stored in Supabase Storage
 * 
 * @param {string} filePath - The storage path of the file
 * @returns {Promise<string>} Signed URL of the file
 * @throws {Error} When unable to generate signed URL
 */
export const getFileUrl = async (filePath: string): Promise<string> => {
  return getPublicUrl('documents', filePath);
};

/**
 * Deletes a document from the server
 * 
 * @param {string} documentId - The ID of the document to delete
 * @returns {Promise<{ status: string }>} Success status of the deletion
 * @throws {Error} When the deletion fails
 */
export const deleteDocument = async (documentId: string): Promise<{ status: string }> => {
  try {
    const response = await axios.delete<{ status: string }>(
      `${import.meta.env.VITE_BACKEND_API_DOMAIN}/upload_documents/${documentId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
