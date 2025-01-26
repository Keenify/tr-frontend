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
  tab_id: string;
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

  console.log("Body:", JSON.stringify({
    title,
    position,
  }));

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
 * @param {string} tabId - The ID of the tab.
 * @returns {Promise<DocumentContent>} - A promise that resolves to the updated or created content data.
 */
export async function upsertDocumentContent(content: DocumentContent): Promise<DocumentContent> {
  const endpoint = `${API_DOMAIN}/documents/contents/`;

  const requestBody = {
    content: content.content,
    tab_id: content.tab_id,
  };

  const response = await fetch(endpoint, {
    method: "POST",
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
