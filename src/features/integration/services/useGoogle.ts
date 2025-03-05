const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

// Types for Google token responses
interface GoogleAuthUrlResponse {
  authorization_url: string;
}

interface GoogleTokenResponse {
  employee_id: string;
  company_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  id: string;
  created_at: string;
  updated_at: string;
}

interface TokenValidationRequest {
  employee_id: string;
  company_id: string;
  refresh?: boolean;
}

interface TokenValidationResponse {
  token_id: string;
  is_valid: boolean;
  expires_at: string;
  was_refreshed: boolean;
}

interface TokenRevokeResponse {
  message: string;
  token_id: string;
}

/**
 * Gets the Google authorization URL
 * @returns {Promise<GoogleAuthUrlResponse>} - A promise that resolves to the authorization URL
 */
export async function getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  const endpoint = `${API_DOMAIN}/google-tokens/auth/url`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to get Google authorization URL');
  }

  return data as GoogleAuthUrlResponse;
}

/**
 * Handles the Google OAuth callback
 * @param {string} code - The authorization code from Google
 * @param {string} employeeId - The employee ID
 * @param {string} companyId - The company ID
 * @returns {Promise<GoogleTokenResponse>} - A promise that resolves to the token data
 */
export async function handleGoogleCallback(
  code: string,
  employeeId: string,
  companyId: string
): Promise<GoogleTokenResponse> {
  const endpoint = `${API_DOMAIN}/google-tokens/auth/callback?code=${encodeURIComponent(code)}&employee_id=${employeeId}&company_id=${companyId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to handle Google callback');
  }

  return data as GoogleTokenResponse;
}

/**
 * Validates a Google token
 * @param {TokenValidationRequest} validationData - The validation request data
 * @returns {Promise<TokenValidationResponse>} - A promise that resolves to the validation response
 */
export async function validateGoogleToken(
  validationData: TokenValidationRequest
): Promise<TokenValidationResponse> {
  const endpoint = `${API_DOMAIN}/google-tokens/tokens/validate-by-employee-company`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validationData),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to validate Google token');
  }

  return data as TokenValidationResponse;
}

/**
 * Revokes a Google token
 * @param {string} tokenId - The ID of the token to revoke
 * @returns {Promise<TokenRevokeResponse>} - A promise that resolves to the revoke response
 */
export async function revokeGoogleToken(tokenId: string): Promise<TokenRevokeResponse> {
  const endpoint = `${API_DOMAIN}/google-tokens/tokens/${encodeURIComponent(tokenId)}/revoke`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to revoke Google token');
  }

  return data as TokenRevokeResponse;
}
