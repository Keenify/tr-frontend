import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useEmployees, ExtendedEmployee } from '../hooks/useEmployees';
import { FormValues, ProcessRow } from '../types/paceFormTypes';
import PaceFormRow from './PaceFormRow';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../shared/hooks/useSession';

const MIN_ROWS = 4;
const MAX_ROWS = 9;

const PaceForm: React.FC = () => {
  // State for loading and submit status
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  // Get session and company data
  const { session } = useSession();
  const userId = session?.user?.id;
  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  

  // React Hook Form setup
  const { control, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      company_id: companyInfo?.id || '',
      processes: Array(MIN_ROWS).fill({
        employee_id: '',
        process_name: '',
        kpi_list: '',
      }),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'processes',
  });

  const selectedCompanyId = companyInfo?.id || '';
  const employees: ExtendedEmployee[] = useEmployees(selectedCompanyId);

  // Set company_id when companyInfo is available
  React.useEffect(() => {
    if (companyInfo?.id) {
      setValue('company_id', companyInfo.id);
    }
  }, [companyInfo?.id, setValue]);

  // Add a new process row
  const handleAddRow = () => {
    if (fields.length < MAX_ROWS) {
      append({
        employee_id: '',
        process_name: '',
        kpi_list: '',
      });
    }
  };

  // Remove a process row
  const handleRemoveRow = (idx: number) => {
    if (fields.length > MIN_ROWS) {
      remove(idx);
    }
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!companyInfo?.id) {
      setSubmitStatus('Company information not available');
      return;
    }
    
    setLoading(true);
    setSubmitStatus(null);
    try {
      // Prepare rows for insertion - only include rows with required data
      const rows = values.processes
        .filter(row => row.employee_id && row.process_name.trim()) // Only submit rows with required data
        .map((row) => ({
          company_id: companyInfo.id,
          employee_id: row.employee_id,
          process_name: row.process_name.trim(),
          kpi_list: row.kpi_list?.trim() || '',
        }));
      
      if (rows.length === 0) {
        setSubmitStatus('Please fill in at least one process with employee and process name');
        return;
      }
      
      console.log('Submitting pace form data:', rows);
      
      // Verify user is authenticated
      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      // Ensure user session is set before database operation
      const { data: currentSession } = await supabase.auth.getSession();
      
      if (!currentSession?.session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      // Insert data with current authenticated session context
      const { data, error } = await supabase
        .from('pace_form')
        .insert(rows)
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Successfully inserted data:', data);
      
      setSubmitStatus('Form submitted successfully!');
      reset();
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSubmitStatus('Submission failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (userDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="ml-3 text-orange-600 font-medium">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-orange-400 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl">
            <span className="font-bold">People:</span> Process Accountability Chart (PACe)
          </h1>
        </div>

      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 border-l border-r border-gray-300">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            1
          </div>
          <span className="text-sm">Identify 4 to 9 processes that drive your business</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            2
          </div>
          <span className="text-sm">Assign someone specific accountability for each process</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            3
          </div>
          <span className="text-sm">Set Key Performance Indicators (KPIs) for each process (enter each KPI on a new line)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Table */}
        <div className="border border-gray-300">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300">
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                2
              </div>
              <div className="font-semibold text-sm text-center">
                Person Accountable
              </div>
            </div>
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                1
              </div>
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 right-0 transform translate-x-1/2">
                3
              </div>
              <div className="font-semibold text-sm text-center">
                Name of Process
              </div>
            </div>
            <div className="p-3 relative">
              <div className="font-semibold text-sm text-center">
                KPIs<br />
                <span className="text-xs text-gray-600">(Better, Faster, Cheaper)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Rows */}
          {fields.map((field, idx) => (
            <PaceFormRow
              key={field.id}
              idx={idx}
              field={field}
              control={control}
              employees={employees} // ExtendedEmployee[]
              selectedCompanyId={selectedCompanyId}
              fieldsLength={fields.length}
              minRows={MIN_ROWS}
              onRemove={handleRemoveRow}
            />
          ))}
        </div>

        {/* Add Row Button */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
          {fields.length < MAX_ROWS && (
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              + Add Process
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          {submitStatus && (
            <div className={`mt-3 text-sm ${submitStatus.startsWith('Form') ? 'text-green-600' : 'text-red-600'}`}>
              {submitStatus}
            </div>
          )}
        </div>
      </form>

      {/* Footer */}
      <div className="bg-gray-50 p-4 border border-gray-300 rounded-b-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
        </div>  
      </div>
    </div>
  );
};

export default PaceForm;
