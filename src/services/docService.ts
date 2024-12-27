// Access environment variables from .env
const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new document.
 * @param {string} title - The title of the document.
 * @param {string} status - The status of the document.
 * @param {string} employeeId - The ID of the employee.
 * @param {string} type - The type of the document.
 * @returns {Promise<any>} - A promise that resolves to the created document data.
 */
export async function createDocument(
  title: string,
  status: string,
  employeeId: string,
  type: string
): Promise<any> {
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
 * Upserts document content.
 * @param {string} content - The content of the document.
 * @param {string} tabId - The ID of the tab.
 * @returns {Promise<any>} - A promise that resolves to the updated or created content data.
 */
export async function upsertDocumentContent(
  content: string,
  tabId: string
): Promise<any> {
  const endpoint = `${API_DOMAIN}/documents/contents/`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: { key: content },
      tab_id: tabId,
    }),
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

/**
 * Fetches a document by its ID.
 * @param {string} documentId - The ID of the document to fetch.
 * @returns {Promise<any>} - A promise that resolves to the fetched document data.
 */
export async function getDocument(documentId: string): Promise<any> {
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
 * @returns {Promise<any>} - A promise that resolves to the created tab data.
 */
export async function createDocumentTab(
  documentId: string,
  title: string,
  position: number
): Promise<any> {
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
 * Updates an existing document.
 * @param {string} documentId - The ID of the document to update.
 * @param {Partial<{ title: string, status: string, employee_id: string, description: string, type: string }>} updateData - The data to update.
 * @returns {Promise<any>} - A promise that resolves to the updated document data.
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
): Promise<any> {
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
 * @returns {Promise<any>} - A promise that resolves to the document content data.
 */
export async function getDocumentContent(tabId: string): Promise<any> {
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
 * @returns {Promise<any>} - A promise that resolves to the list of document data.
 */
export async function getDocumentsByType(type: string): Promise<any> {
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
