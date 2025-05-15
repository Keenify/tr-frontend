import { 
  ScoreboardData,
  CreateScoreboardPayload, 
  UpdateScoreboardPayload 
} from '../types/scoreboard';

const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN || '';

/**
 * Creates a new scoreboard entry
 * @param {CreateScoreboardPayload} payload - The scoreboard data to create
 * @param {string} companyId - The company ID for the new scoreboard entry
 * @returns {Promise<ScoreboardData>} - A promise that resolves to the created scoreboard data
 */
export async function createScoreboard(
  payload: CreateScoreboardPayload,
  companyId: string
): Promise<ScoreboardData> {
  const endpoint = `${API_DOMAIN}/scoreboard/${companyId}`;
  
  console.log('Creating scoreboard entry with endpoint:', endpoint);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  // Validate payload
  if (!payload.employee_id) {
    console.error('❌ Invalid payload: employee_id is missing or empty');
    throw new Error('Employee ID is required to create a scoreboard entry');
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
      throw new Error(`Failed to create scoreboard entry: ${response.status} ${response.statusText}`);
    }

    return data as ScoreboardData;
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    throw error;
  }
}

/**
 * Updates an existing scoreboard entry
 * @param {string} scoreboardId - The ID of the scoreboard entry to update
 * @param {string} companyId - The company ID for the scoreboard entry
 * @param {UpdateScoreboardPayload} payload - The scoreboard data to update
 * @returns {Promise<ScoreboardData>} - A promise that resolves to the updated scoreboard data
 */
export async function updateScoreboard(
  scoreboardId: string,
  companyId: string,
  payload: UpdateScoreboardPayload
): Promise<ScoreboardData> {
  const endpoint = `${API_DOMAIN}/scoreboard/${scoreboardId}/company/${companyId}`;
  
  console.log('Updating scoreboard entry with endpoint:', endpoint);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to update scoreboard entry: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as ScoreboardData;
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    throw error;
  }
}

/**
 * Deletes a scoreboard entry
 * @param {string} scoreboardId - The ID of the scoreboard entry to delete
 * @param {string} companyId - The company ID for the scoreboard entry
 * @returns {Promise<void>} - A promise that resolves when the deletion is successful
 */
export async function deleteScoreboard(
  scoreboardId: string,
  companyId: string
): Promise<void> {
  const endpoint = `${API_DOMAIN}/scoreboard/${scoreboardId}/company/${companyId}`;
  
  console.log('Deleting scoreboard entry with endpoint:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to delete scoreboard entry: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    throw error;
  }
}

/**
 * Fetches a specific scoreboard entry by ID
 * @param {string} scoreboardId - The ID of the scoreboard entry to fetch
 * @param {string} companyId - The company ID for the scoreboard entry
 * @returns {Promise<ScoreboardData>} - A promise that resolves to the scoreboard data
 */
export async function getScoreboard(
  scoreboardId: string,
  companyId: string
): Promise<ScoreboardData> {
  const endpoint = `${API_DOMAIN}/scoreboard/${scoreboardId}/company/${companyId}`;
  
  console.log('Fetching scoreboard entry with endpoint:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to fetch scoreboard entry: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as ScoreboardData;
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    throw error;
  }
}

/**
 * Fetches all scoreboard entries for a specific employee
 * @param {string} employeeId - The ID of the employee
 * @returns {Promise<ScoreboardData[]>} - A promise that resolves to an array of scoreboard data
 */
export async function getEmployeeScoreboards(
  employeeId: string
): Promise<ScoreboardData[]> {
  if (!employeeId) {
    console.error('❌ Invalid employee ID:', employeeId);
    throw new Error('Employee ID is required to fetch scoreboard entries');
  }

  const endpoint = `${API_DOMAIN}/scoreboard/employee/${employeeId}`;
  
  console.log('Fetching employee scoreboards with endpoint:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to fetch employee scoreboard entries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API returned unexpected data format:', data);
      return [];
    }
    
    return data as ScoreboardData[];
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
}

/**
 * Fetches all scoreboard entries for a specific company
 * @param {string} companyId - The ID of the company
 * @returns {Promise<ScoreboardData[]>} - A promise that resolves to an array of scoreboard data
 */
export async function getCompanyScoreboards(
  companyId: string
): Promise<ScoreboardData[]> {
  if (!companyId) {
    console.error('❌ Invalid company ID:', companyId);
    throw new Error('Company ID is required to fetch scoreboard entries');
  }

  const endpoint = `${API_DOMAIN}/scoreboard/company/${companyId}`;
  
  console.log('Fetching company scoreboards with endpoint:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to fetch company scoreboard entries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API returned unexpected data format:', data);
      return [];
    }
    
    return data as ScoreboardData[];
  } catch (error) {
    console.error('❌ Exception during API request:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
}
