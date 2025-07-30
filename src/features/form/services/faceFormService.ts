const API_DOMAIN = import.meta.env.VITE_BACKEND_API_DOMAIN;

export interface FaceFormRow {
  company_id: string;
  function_name: string;
  accountable_employee_id: string;
  kpi_list: string;
  outcome_list: string;
  business_unit_name: string;
  head_employee_id: string;
  enthusiastically_rehire: boolean;
}

/**
 * Submits face form data to the API
 * @param {FaceFormRow[]} rows - Array of face form rows to submit
 * @returns {Promise<any>} - Promise that resolves to the API response
 */
export async function submitFaceForm(rows: FaceFormRow[]): Promise<any> {
  const endpoint = `${API_DOMAIN}/face-form/submit`;
  
  console.log('Submitting face form to endpoint:', endpoint);
  console.log('Face form data:', rows);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ functions: rows }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Face form submission failed:', {
      status: response.status,
      statusText: response.statusText,
      data,
      endpoint
    });
    throw new Error(`Failed to submit face form: ${data.message || response.statusText}`);
  }

  console.log('✅ Face form submitted successfully:', data);
  return data;
}