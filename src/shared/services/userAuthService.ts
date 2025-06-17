import { directoryService } from './directoryService';

// Access environment variables from .env
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_DOMAIN;

interface CreateUserParams {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title?: string;
  phone?: string;
  company_id: string;
}

interface AuthUserResponse {
  id: string;
  email: string;
}

/**
 * Checks if a user with the given email already exists in the company
 * @param email Email to check
 * @param companyId Company ID to check within
 * @returns Promise resolving to boolean indicating if user exists
 */
export const checkUserExists = async (email: string, companyId: string): Promise<boolean> => {
  try {
    // Fetch employees for the company and check if email exists
    const employees = await directoryService.fetchEmployees(companyId);
    return employees.some(emp => emp.email?.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false; // Assume user doesn't exist if check fails
  }
};

/**
 * Creates a new user using the backend endpoint that handles both auth and employee creation
 * @param params User creation parameters
 * @returns Promise resolving to the created user data
 */
export const createUserWithBackend = async (params: CreateUserParams): Promise<AuthUserResponse> => {
  console.log('🚀 Starting user creation process via backend...');
  console.log('📝 Input parameters:', { ...params, password: '[REDACTED]' });
  
  try {
    // Step 0: Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const userExists = await checkUserExists(params.email, params.company_id);
    if (userExists) {
      throw new Error('A user with this email already exists in your company. Please use a different email.');
    }
    console.log('✅ User does not exist, proceeding with creation');

    // Step 1: Call backend endpoint to create user and employee
    console.log('📤 Calling backend create-user endpoint...');
    const response = await fetch(`${API_BASE_URL}/employees/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error details:', errorText);
      
      let errorMessage = `Failed to create user (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch {
        // If parsing fails, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ User and employee created successfully:', result);
    
    return {
      id: result.user_id || result.id,
      email: result.email,
    };
    
  } catch (error) {
    console.error('❌ Error in createUserWithBackend:', error);
    throw error;
  }
};

// Keep the old function name for compatibility but use the new backend approach
export const createUserWithSignUp = createUserWithBackend; 