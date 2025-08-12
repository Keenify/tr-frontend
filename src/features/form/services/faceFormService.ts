import { supabase } from '../../../lib/supabase';

export interface FaceFormRow {
  company_id: string;
  function_name: string;
  accountable_employee_id: string | null;
  kpi_list: string;
  outcome_list: string;
  is_business_unit: boolean;
}

/**
 * Submits face form data to Supabase
 * @param {FaceFormRow[]} rows - Array of face form rows to submit
 * @returns {Promise<any>} - Promise that resolves to the submission result
 */
export async function submitFaceForm(rows: FaceFormRow[]): Promise<{ success: boolean; data?: unknown }> {
  console.log('Submitting face form to Supabase:', rows);

  try {
    // Insert all face form rows into the database
    const { data, error } = await supabase
      .from('face_form')
      .insert(rows)
      .select();

    if (error) {
      console.error('❌ Face form submission failed:', error);
      throw new Error(`Failed to submit face form: ${error.message}`);
    }

    console.log('✅ Face form submitted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Face form submission error:', error);
    throw error;
  }
}