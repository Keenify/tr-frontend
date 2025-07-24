const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

export interface PaceFormRow {
  company_id: string;
  employee_id: string;
  process_name: string;
  kpi_better: string;
  kpi_faster: string;
  kpi_cheaper: string;
}

/**
 * Submits pace form data to the API
 * @param {PaceFormRow[]} rows - Array of pace form rows to submit
 * @returns {Promise<any>} - Promise that resolves to the API response
 */
export async function submitPaceForm(rows: PaceFormRow[]): Promise<any> {
  const endpoint = `${API_DOMAIN}/pace-form/submit`;
  
  console.log('Submitting pace form to endpoint:', endpoint);
  console.log('Pace form data:', rows);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processes: rows }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Pace form submission failed:', {
      status: response.status,
      statusText: response.statusText,
      data,
      endpoint
    });
    throw new Error(`Failed to submit pace form: ${data.message || response.statusText}`);
  }

  console.log('✅ Pace form submitted successfully:', data);
  return data;
}