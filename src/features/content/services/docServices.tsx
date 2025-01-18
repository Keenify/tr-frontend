// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new document.
 * @param {string} title - The title of the document.
 * @param {string} status - The status of the document.
 * @param {string} employeeId - The ID of the employee.
 * @param {string} type - The type of the document.
 * @returns {Promise<{ id: string; title: string; position: number }>} - A promise that resolves to the created document data.
 */
export async function createDocument(
    title: string,
    status: string,
    employeeId: string,
    type: string,
    companyId: string
  ): Promise<{ id: string; title: string; position: number }> {
    const endpoint = `${API_DOMAIN}/documents/`;
  
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        status,
        employee_id: employeeId,
        company_id: companyId,
        description: '',
        type,
      }),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      console.error("❌ API request failed:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error("Failed to create document");
    }
  
    return data;
  }
  
  
  
  /**
   * Fetches a document by its ID.
   * @param {string} documentId - The ID of the document to fetch.
   * @returns {Promise<{ id: string; title: string; content: string }>} - A promise that resolves to the fetched document data.
   */
  export async function getDocument(documentId: string): Promise<{ id: string; title: string; content: string }> {
    const endpoint = `${API_DOMAIN}/documents/${documentId}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      console.error("❌ API request failed:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error("Failed to fetch document");
    }
  
    return data;
  }


  /**
 * Fetches documents by type.
 * @param {string} type - The type of the document. Acceptable values are 'none', 'Processes', 'Company', 'Policies'.
 * @returns {Promise<{ id: string; title: string; position: number }[]>} - A promise that resolves to the list of document data.
 */
export async function getDocumentsByType(type: string, companyId: string): Promise<{ id: string; title: string; position: number }[]> {
    const endpoint = type === 'none' 
      ? `${API_DOMAIN}/documents/type/?company_id=${companyId}`
      : `${API_DOMAIN}/documents/type/?document_type=${encodeURIComponent(type)}&company_id=${companyId}`;
  
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      console.error("❌ API request failed:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error("Failed to fetch documents by type");
    }
  
    return data;
  }  


  /**
 * Updates an existing document.
 * @param {string} documentId - The ID of the document to update.
 * @param {Partial<{ title: string, status: string, employee_id: string, description: string, type: string }>} updateData - The data to update.
 * @returns {Promise<{ id: string; title: string; position: number }>} - A promise that resolves to the updated document data.
 */
export async function updateDocument(
    documentId: string,
    updateData: Partial<{
      title: string;
      status: string;
      employee_id: string;
      description: string;
      type: string;
    }>
  ): Promise<{ id: string; title: string; position: number }> {
    const endpoint = `${API_DOMAIN}/documents/${documentId}`;
  
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      console.error("❌ API request failed:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error("Failed to update document");
    }
  
    return data;
  }


  /**
 * Deletes a document by its ID.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful.
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
    const endpoint = `${API_DOMAIN}/documents/${documentId}`;
  
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
  
    if (!response.ok) {
      console.error("❌ API request failed:", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error("Failed to delete document");
    }
  
    const data = await response.json();
    return data;
  }


