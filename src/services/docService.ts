// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

export interface Step {
  title: string;
  content: string;
  step_number: number;
}

export interface DocumentContent {
  content: {
    steps: Step[];
  };
  id: string;
  tab_id: string;
}

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
  type: string
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
 * Creates a new document tab.
 * @param {string} documentId - The ID of the document.
 * @param {string} title - The title of the tab.
 * @param {number} position - The position of the tab.
 * @returns {Promise<{ id: string; title: string; position: number }>} - A promise that resolves to the created tab data.
 */
export async function createDocumentTab(
  documentId: string,
  title: string,
  position: number
): Promise<{ id: string; title: string; position: number }> {
  const endpoint = `${API_DOMAIN}/documents/${documentId}/tabs/`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      position,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ API request failed:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    throw new Error("Failed to create document tab");
  }

  return data;
}

/**
 * Fetches document tabs. If a tabId is provided, fetches the specific tab.
 * @param {string} documentId - The ID of the document.
 * @param {string} [tabId] - Optional ID of the tab to fetch.
 * @returns {Promise<{ id: string; title: string; position: number }[]>} - A promise that resolves to an array of tab data.
 */
export async function getDocumentTabs(documentId: string, tabId?: string): Promise<{ id: string; title: string; position: number }[]> {
  const endpoint = `${API_DOMAIN}/documents/${documentId}/tabs/${tabId ? `?tab_id=${encodeURIComponent(tabId)}` : ''}`;

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
    throw new Error("Failed to fetch document tabs");
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
 * Fetches document content by tab ID.
 * @param {string} tabId - The ID of the tab.
 * @returns {Promise<{ content: { key: string }; tab_id: string }>} - A promise that resolves to the document content data.
 */
export async function getDocumentContent(tabId: string): Promise<DocumentContent> {
  const endpoint = `${API_DOMAIN}/documents/contents/${encodeURIComponent(tabId)}`;

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
    throw new Error("Failed to fetch document content");
  }

  return data;
}


/**
 * Fetches documents by type.
 * @param {string} type - The type of the document. Acceptable values are 'none', 'Processes', 'Company', 'Policies'.
 * @returns {Promise<{ id: string; title: string; position: number }[]>} - A promise that resolves to the list of document data.
 */
export async function getDocumentsByType(type: string): Promise<{ id: string; title: string; position: number }[]> {
  const endpoint = type === 'none' 
    ? `${API_DOMAIN}/documents/type/`
    : `${API_DOMAIN}/documents/type/?document_type=${encodeURIComponent(type)}`;

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

/**
 * Deletes a document tab.
 * @param {string} documentId - The ID of the document.
 * @param {string} tabId - The ID of the tab to delete.
 * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful.
 */
export async function deleteDocumentTab(documentId: string, tabId: string): Promise<boolean> {
  const endpoint = `${API_DOMAIN}/documents/${documentId}/tabs/${tabId}`;

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
    throw new Error("Failed to delete document tab");
  }

  const data = await response.json();
  return data;
}

/**
 * Updates a document tab.
 * @param {string} documentId - The ID of the document.
 * @param {string} tabId - The ID of the tab to update.
 * @param {Partial<{ title: string, position: number }>} updateData - The data to update.
 * @returns {Promise<{ id: string; title: string; position: number }>} - A promise that resolves to the updated tab data.
 */
export async function updateDocumentTab(
  documentId: string,
  tabId: string,
  updateData: Partial<{
    title: string;
    position: number;
  }>
): Promise<{ id: string; title: string; position: number }> {
  const endpoint = `${API_DOMAIN}/documents/${documentId}/tabs/${tabId}`;

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
    throw new Error("Failed to update document tab");
  }

  return data;
}

/**
 * Upserts document content.
 * @param {DocumentContent} content - The content of the document.
 * @param {string} contentId - The ID of the content.
 * @returns {Promise<DocumentContent>} - A promise that resolves to the updated or created content data.
 */
export async function upsertDocumentContent(content: DocumentContent, contentId: string): Promise<DocumentContent> {
  const endpoint = `${API_DOMAIN}/documents/contents/${contentId}`;

  const requestBody = {
    content: {
      steps: content.content.steps,
    },
  };

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ API request failed:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    throw new Error("Failed to upsert document content");
  }

  return data;
}
