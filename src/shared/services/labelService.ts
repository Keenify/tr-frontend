import { Label } from "../types/label.types";
import { Card } from "../components/trello/types/card.types";

// Access environment variables from .env
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_DOMAIN;

// TODO: Define the Label type in a shared types file like src/shared/types/label.types.ts
// For now, using a placeholder interface.
/*
interface Label {
  id: string;
  text: string;
  color_code: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}
*/

// Type for creating a label (required fields)
type CreateLabelData = Pick<Label, "text" | "color_code" | "company_id">;

// Type for updating a label (optional fields)
type UpdateLabelData = Partial<Pick<Label, "text" | "color_code">>;

export const labelService = {
  /**
   * Fetches labels for a given company.
   * @param companyId - The ID of the company whose labels are to be fetched.
   * @param skip - Optional number of records to skip for pagination.
   * @param limit - Optional limit on the number of records to return.
   * @returns A promise that resolves to an array of Label objects.
   * @throws Will throw an error if the fetch operation fails.
   */
  async fetchLabelsByCompany(
    companyId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<Label[]> {
    const response = await fetch(
      `${API_BASE_URL}/labels/?company_id=${companyId}&skip=${skip}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch labels by company");
    }
    return response.json();
  },

  /**
   * Fetches a single label by its ID.
   * @param labelId - The ID of the label to fetch.
   * @returns A promise that resolves to the Label object.
   * @throws Will throw an error if the fetch operation fails.
   */
  async fetchLabelById(labelId: string): Promise<Label> {
    const response = await fetch(`${API_BASE_URL}/labels/${labelId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch label by ID");
    }
    return response.json();
  },

  /**
   * Fetches label IDs assigned to a specific card.
   * @param cardId - The ID of the card.
   * @returns A promise that resolves to an array of assigned label IDs.
   * @throws Will throw an error if the fetch operation fails.
   */
  async fetchLabelsByCard(cardId: string): Promise<string[]> {
    console.warn("[Placeholder] fetchLabelsByCard called. Implement real API call.", cardId);
    // Simulate fetching - replace with actual API endpoint for card-label associations
    await new Promise(resolve => setTimeout(resolve, 150)); 
    // Return an empty array or mock data based on your backend structure
    // Example: Fetch from /cards/{cardId}/labels 
    return []; // Placeholder return
  },

  /**
   * Adds a new label.
   * @param labelData - Data for the new label (text, color_code, company_id).
   * @returns A promise that resolves to the newly added Label object.
   * @throws Will throw an error if the add operation fails.
   */
  async createLabel(labelData: CreateLabelData): Promise<Label> {
    console.log('[labelService] createLabel called with:', labelData);
    const response = await fetch(`${API_BASE_URL}/labels/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(labelData),
    });
    console.log('[labelService] createLabel raw response status:', response.status);
    const responseBody = await response.text(); // Read body once as text
    console.log('[labelService] createLabel raw response body:', responseBody);

    if (!response.ok) { // Check for 201 Created specifically? API returns 201
        if (response.status !== 201) {
             console.error(`[labelService] Failed to add label. Status: ${response.status}, Body: ${responseBody}`);
             throw new Error(`Failed to add label. Status: ${response.status}`);
        }
    }
    try {
        return JSON.parse(responseBody); // Parse the stored text body
    } catch (e) {
        console.error('[labelService] Failed to parse createLabel response body:', e);
        throw new Error('Failed to parse server response for createLabel.');
    }
  },

  /**
   * Updates an existing label.
   * @param labelId - The ID of the label to update.
   * @param updateData - Data to update the label with (text, color_code).
   * @returns A promise that resolves to the updated Label object.
   * @throws Will throw an error if the update operation fails.
   */
  async updateLabel(labelId: string, updateData: UpdateLabelData): Promise<Label> {
    const response = await fetch(`${API_BASE_URL}/labels/${labelId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error("Failed to update label");
    }
    return response.json();
  },

  /**
   * Deletes a label by its ID.
   * @param labelId - The ID of the label to delete.
   * @returns A promise that resolves to true if deletion was successful, false otherwise.
   * @throws Will throw an error if the delete operation fails unexpectedly.
   */
  async deleteLabel(labelId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/labels/${labelId}`, {
      method: "DELETE",
    });
    // Check specifically for 200 OK or potentially 204 No Content if API changes
    if (!response.ok) {
        // Log error but return false, or re-throw if preferred
        console.error(`Failed to delete label. Status: ${response.status}`);
        // throw new Error(`Failed to delete label. Status: ${response.status}`); 
        return false; // Indicate failure
    }
    // Consider response body? API might return the deleted object or nothing (204)
    // For now, success is indicated by response.ok
    return true; // Indicate success
  },

  /**
   * Updates the list of labels associated with a specific card.
   * @param cardId - The ID of the card to update.
   * @param labelIds - The complete array of label IDs to associate with the card.
   * @returns A promise that resolves to the updated card object (or void/boolean depending on actual API).
   * @throws Will throw an error if the update operation fails.
   */
  async updateCardLabels(cardId: string, labelIds: string[]): Promise<Card> {
    console.log(`[labelService] updateCardLabels called for card ${cardId} with labels:`, labelIds);
    const response = await fetch(`${API_BASE_URL}/trello/cards/${cardId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({ label_ids: labelIds }),
    });
    console.log('[labelService] updateCardLabels raw response status:', response.status);
    const responseBody = await response.text();
    console.log('[labelService] updateCardLabels raw response body:', responseBody);

    if (!response.ok) {
        console.error(`[labelService] Failed to update card labels. Status: ${response.status}, Body: ${responseBody}`);
        throw new Error(`Failed to update card labels. Status: ${response.status}`);
    }
    try {
        return JSON.parse(responseBody);
    } catch (e) {
        console.error('[labelService] Failed to parse updateCardLabels response body:', e);
        throw new Error('Failed to parse server response for updateCardLabels.');
    }
  },
};
