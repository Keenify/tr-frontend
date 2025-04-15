import { Label } from "../types/label.types";

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
   * Adds a new label.
   * @param labelData - Data for the new label (text, color_code, company_id).
   * @returns A promise that resolves to the newly added Label object.
   * @throws Will throw an error if the add operation fails.
   */
  async createLabel(labelData: CreateLabelData): Promise<Label> {
    const response = await fetch(`${API_BASE_URL}/labels/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(labelData),
    });
    if (!response.ok) { // Check for 201 Created specifically? API returns 201
        if (response.status !== 201) {
             throw new Error(`Failed to add label. Status: ${response.status}`);
        }
    }
    return response.json();
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
   * @returns A promise that resolves to the deleted Label object (as returned by the API).
   * @throws Will throw an error if the delete operation fails.
   */
  async deleteLabel(labelId: string): Promise<Label> {
    const response = await fetch(`${API_BASE_URL}/labels/${labelId}`, {
      method: "DELETE",
    });
    // Check specifically for 200 OK, as DELETE often returns 204 No Content or 200 OK with body
    if (!response.ok) {
        throw new Error(`Failed to delete label. Status: ${response.status}`);
    }
    // The API seems to return the deleted object with status 200
    return response.json();
  },
};
