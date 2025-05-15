import { Employee } from "../types/directory.types";

// Access environment variables from .env
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_DOMAIN;

export const directoryService = {
  /**
   * Fetches a list of employees for a given company.
   * @param companyId - The ID of the company whose employees are to be fetched.
   * @returns A promise that resolves to an array of Employee objects.
   * @throws Will throw an error if the fetch operation fails.
   */
  async fetchEmployees(companyId: string): Promise<Employee[]> {
    // Safety check: don't make API call with empty company ID
    if (!companyId) {
      console.error("Company ID is missing - cannot fetch employees");
      return []; // Return empty array instead of making a bad API call
    }
    
    console.log(`Fetching employees for company ID: ${companyId}`);
    const response = await fetch(
      `${API_BASE_URL}/employees/company/${companyId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch employees");
    }
    return response.json();
  },

  /**
   * Fetches an employee by user ID.
   * @param userId - The ID of the user to fetch.
   * @returns A promise that resolves to the Employee object.
   * @throws Will throw an error if the fetch operation fails.
   */
  async fetchEmployee(userId: string): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch employee");
    }
    return response.json();
  },

  /**
   * Adds a new employee.
   * @param employeeData - Partial data of the employee to be added.
   * @returns A promise that resolves to the newly added Employee object.
   * @throws Will throw an error if the add operation fails.
   */
  async addEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) {
      throw new Error("Failed to add employee");
    }
    return response.json();
  },

  /**
   * Updates an employee's information.
   * @param userId - The ID of the user to update.
   * @param updateData - Partial data of the employee to be updated.
   * @returns A promise that resolves to the updated Employee object.
   * @throws Will throw an error if the update operation fails.
   */
  async updateEmployee(userId: string, updateData: Partial<Employee>): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error("Failed to update employee");
    }
    return response.json();
  },
};
