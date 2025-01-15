import axios from 'axios';

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
