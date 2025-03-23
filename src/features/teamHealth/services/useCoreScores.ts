import { 
  CoreScoreData, 
  CoreScoreWithDetailsData, 
  CreateCoreScorePayload, 
  UpdateCoreScorePayload 
} from '../types/coreScore';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

/**
 * Creates a new employee core score
 * @param {CreateCoreScorePayload} payload - The core score data to create
 * @returns {Promise<CoreScoreData>} - A promise that resolves to the created core score data
 */
export async function createCoreScore(payload: CreateCoreScorePayload): Promise<CoreScoreData> {
  const endpoint = `${API_DOMAIN}/employee-core-scores/`;
  
  console.log('API_DOMAIN:', API_DOMAIN);
  console.log('Full endpoint URL:', endpoint);
  
  // Validate payload
  if (!payload.employee_id) {
    console.error('❌ Invalid payload: employee_id is missing or empty');
    throw new Error('Employee ID is required to create a core score');
  }
  
  if (!payload.core_value_id) {
    console.error('❌ Invalid payload: core_value_id is missing or empty');
    throw new Error('Core Value ID is required to create a core score');
  }
  
  if (payload.score < 0 || payload.score > 3) {
    console.error('❌ Invalid payload: score is out of range (0-3):', payload.score);
    throw new Error('Score must be between 0 and 3');
  }
  
  // Log payload in formatted JSON
  console.log('Creating core score with payload:', JSON.stringify(payload, null, 2));
  console.log('Employee ID type:', typeof payload.employee_id);

  try {
    // Create headers with API Key if available
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Log final request details
    console.log('Making API request with:');
    console.log('- Method: POST');
    console.log('- Endpoint:', endpoint);
    console.log('- Headers:', headers);
    console.log('- Body:', JSON.stringify(payload));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.log('API response status:', response.status, response.statusText);
    
    // Clone the response to read it twice (once for logging, once for processing)
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log('API response text:', responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed API response data:', data);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      data = responseText;
    }

    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        payload,
        data
      });
      throw new Error(`Failed to create employee core score: ${response.status} ${response.statusText} - ${typeof data === 'object' ? JSON.stringify(data) : data}`);
    }

    return data as CoreScoreData;
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    throw error;
  }
}

/**
 * Updates an existing employee core score
 * @param {string} scoreId - The ID of the core score to update
 * @param {UpdateCoreScorePayload} payload - The core score data to update
 * @returns {Promise<CoreScoreData>} - A promise that resolves to the updated core score data
 */
export async function updateCoreScore(
  scoreId: string,
  payload: UpdateCoreScorePayload
): Promise<CoreScoreData> {
  const endpoint = `${API_DOMAIN}/employee-core-scores/${encodeURIComponent(scoreId)}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error('Failed to update employee core score');
  }

  return data as CoreScoreData;
}

/**
 * Fetches core scores with details for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<CoreScoreWithDetailsData[]>} - A promise that resolves to an array of core scores with details
 */
export async function getEmployeeCoreScoresWithDetails(
  employeeId: string,
  skip: number = 0,
  limit: number = 100
): Promise<CoreScoreWithDetailsData[]> {
  // Validate employeeId
  if (!employeeId) {
    console.error('❌ Invalid employee ID:', employeeId);
    throw new Error('Employee ID is required to fetch core scores');
  }

  const endpoint = `${API_DOMAIN}/employee-core-scores/employee/${encodeURIComponent(employeeId)}/details?skip=${skip}&limit=${limit}`;
  
  console.log('Fetching core scores with endpoint:', endpoint);
  console.log('Employee ID:', employeeId);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Get scores response status:', response.status, response.statusText);
    
    // Clone the response to read it twice (once for logging, once for processing)
    const responseClone = response.clone();
    let responseText;
    try {
      responseText = await responseClone.text();
      console.log('Get scores response text:', responseText);
    } catch (e) {
      console.error('Error reading response text:', e);
      responseText = 'Failed to read response text';
    }
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed get scores response data:', data);
    } catch (parseError) {
      console.error('Failed to parse get scores response as JSON:', parseError);
      data = [];
    }

    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        employeeId,
        responseText
      });
      throw new Error(`Failed to fetch employee core scores with details: ${response.status} ${response.statusText}`);
    }

    if (!Array.isArray(data)) {
      console.error('❌ API returned unexpected data format:', data);
      return [];
    }

    return data as CoreScoreWithDetailsData[];
  } catch (error) {
    console.error('❌ Exception during getEmployeeCoreScoresWithDetails:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
}

/**
 * Get a specific core score by ID
 * @param {string} scoreId - The ID of the core score
 * @returns {Promise<CoreScoreData>} - A promise that resolves to the core score data
 */
export async function getCoreScore(scoreId: string): Promise<CoreScoreData> {
  const endpoint = `${API_DOMAIN}/employee-core-scores/${encodeURIComponent(scoreId)}`;

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
    throw new Error('Failed to fetch core score');
  }

  return data as CoreScoreData;
}

/**
 * Fetches all core scores for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @param {number} skip - Number of records to skip (for pagination)
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<CoreScoreData[]>} - A promise that resolves to an array of core score data
 */
export async function getEmployeeCoreScores(
  employeeId: string,
  skip: number = 0,
  limit: number = 100
): Promise<CoreScoreData[]> {
  const endpoint = `${API_DOMAIN}/employee-core-scores/employee/${encodeURIComponent(employeeId)}?skip=${skip}&limit=${limit}`;

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
    throw new Error('Failed to fetch employee core scores');
  }

  return data as CoreScoreData[];
}
