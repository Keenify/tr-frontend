import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useEmployees, ExtendedEmployee } from '../hooks/useEmployees';
import { FormValues, ProcessRow, PaceFormDatabaseRow } from '../types/paceFormTypes';
import PaceFormRow from './PaceFormRow';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../shared/hooks/useSession';

const MIN_ROWS = 4;
const MAX_ROWS = 9;

const PaceForm: React.FC = () => {
  // State for loading and submit status
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  // New states for view/edit mode and data persistence
  const [isEditMode, setIsEditMode] = useState(true);
  const [hasSubmittedData, setHasSubmittedData] = useState(false);
  const [submittedData, setSubmittedData] = useState<PaceFormDatabaseRow[]>([]);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // Get session and company data
  const { session } = useSession();
  const userId = session?.user?.id;
  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  

  // React Hook Form setup
  const { control, handleSubmit, setValue } = useForm<FormValues>({
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

  // Load existing form data on mount
  const loadExistingData = async () => {
    if (!companyInfo?.id) return;
    
    setLoadingExistingData(true);
    try {
      const { data, error } = await supabase
        .from('pace_form')
        .select('*')
        .eq('company_id', companyInfo.id);
      
      if (error) {
        console.error('Error loading existing data:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setSubmittedData(data);
        setHasSubmittedData(true);
        setIsEditMode(false); // Start in view mode if data exists
        
        // Populate form with existing data
        populateFormWithExistingData(data);
      }
    } catch (error) {
      console.error('Failed to load existing data:', error);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Populate form fields with existing data
  const populateFormWithExistingData = (data: PaceFormDatabaseRow[]) => {
    const processData: ProcessRow[] = data.map(row => ({
      employee_id: row.employee_id,
      process_name: row.process_name,
      kpi_list: row.kpi_list,
    }));
    
    // Ensure we have at least MIN_ROWS and at most MAX_ROWS
    const clampedLength = Math.max(Math.min(processData.length, MAX_ROWS), MIN_ROWS);
    const updatedProcesses: ProcessRow[] = Array(clampedLength).fill(null).map((_, index) => {
      return processData[index] || {
        employee_id: '',
        process_name: '',
        kpi_list: '',
      };
    });
    
    setValue('processes', updatedProcesses);
  };

  // Load existing data when component mounts and company info is available
  useEffect(() => {
    if (companyInfo?.id && !loadingExistingData) {
      loadExistingData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyInfo?.id]);

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

  // Function to compare existing data with new data
  const hasDataChanged = (newRows: ProcessRow[], existingData: PaceFormDatabaseRow[]): boolean => {
    // If different number of rows, data has changed
    if (newRows.length !== existingData.length) {
      return true;
    }
    
    // Sort both arrays by employee_id and process_name for consistent comparison
    const sortedNew = [...newRows].sort((a, b) => 
      a.employee_id.localeCompare(b.employee_id) || a.process_name.localeCompare(b.process_name)
    );
    const sortedExisting = [...existingData].sort((a, b) => 
      a.employee_id.localeCompare(b.employee_id) || a.process_name.localeCompare(b.process_name)
    );
    
    // Compare each row
    for (let i = 0; i < sortedNew.length; i++) {
      const newRow = sortedNew[i];
      const existingRow = sortedExisting[i];
      
      if (
        newRow.employee_id !== existingRow.employee_id ||
        newRow.process_name !== existingRow.process_name ||
        newRow.kpi_list !== existingRow.kpi_list
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!companyInfo?.id) {
      setSubmitStatus('Company information not available');
      return;
    }
    
    if (!userInfo?.id) {
      setSubmitStatus('Employee information not available');
      return;
    }
    
    setLoading(true);
    setSubmitStatus(null);
    try {
      // Prepare rows for insertion - only include rows with required data
      const filteredRows = values.processes
        .filter(row => row.employee_id && row.process_name.trim()) // Only submit rows with required data
        .map((row) => ({
          company_id: companyInfo.id,
          employee_id: row.employee_id, // The person accountable for the process (matches database schema)
          process_name: row.process_name.trim(),
          kpi_list: row.kpi_list?.trim() || '',
        }));
      
      // Combine all valid rows - same as face form logic
      const rows = filteredRows;
      
      // Validate company-wide entry limits (4-9 entries total)
      if (rows.length < MIN_ROWS) {
        setSubmitStatus(`Company must have at least ${MIN_ROWS} processes. Please add more processes.`);
        setLoading(false);
        return;
      }
      
      if (rows.length > MAX_ROWS) {
        setSubmitStatus(`Company can have maximum ${MAX_ROWS} processes. Please remove some processes.`);
        setLoading(false);
        return;
      }
      
      // Note: Duplicate process names within the form will be handled by upsert
      // The last occurrence in the form will be the final value for that process name
      
      // Check if data has actually changed before updating database
      if (hasSubmittedData && submittedData.length > 0) {
        const dataChanged = hasDataChanged(rows, submittedData);
        if (!dataChanged) {
          setSubmitStatus('No changes detected. Data is already up to date.');
          setLoading(false);
          return;
        }
      }
      
      console.log('Submitting pace form data:', rows);
      
      // Verify user is authenticated
      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      // Ensure user session is set before database operation
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session. Please log in again.');
      }
      
      if (!currentSession?.session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      console.log('Current user ID:', currentSession.session.user.id);
      console.log('Inserting with authenticated session');
      
      // First, let's try to check the table structure
      console.log('Attempting to check table structure...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('pace_form')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Table check error:', tableError);
      } else {
        console.log('Table check result:', tableCheck);
      }
      
      // Use upsert to handle duplicates and potential RLS issues - same as face form
      const { data, error } = await supabase
        .from('pace_form')
        .upsert(rows, { onConflict: 'company_id,process_name' })
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Failed rows data:', rows);
        
        // Check for duplicate process name error
        if (error.code === '21000' || error.message.includes('ON CONFLICT DO UPDATE command cannot affect row a second time')) {
          throw new Error('There should not be duplicate names of processes. Please ensure each process has a unique name.');
        }
        throw new Error(`Database insert failed: ${error.message} (Code: ${error.code})`);
      }
      
      
      console.log('Successfully saved data:', data);
      
      setSubmitStatus('Form submitted successfully!');
      setSubmittedData(data);
      setHasSubmittedData(true);
      setIsEditMode(false); // Switch to view mode after successful submission
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSubmitStatus('Submission failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (userDataLoading || loadingExistingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="ml-3 text-orange-600 font-medium">
          {loadingExistingData ? 'Loading existing data...' : 'Loading form...'}
        </p>
      </div>
    );
  }

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    setSubmitStatus(null); // Clear any previous status messages
  };

  // Render read-only view for submitted data
  const renderReadOnlyView = () => {
    if (!hasSubmittedData || submittedData.length === 0) return null;
    
    return (
      <div className="border border-gray-300 bg-gray-50">
        {/* Table Header */}
        <div className="grid grid-cols-3 bg-gray-200 border-b border-gray-300">
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">Person Accountable</div>
          </div>
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">Name of Process</div>
          </div>
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">KPIs<br />(Better, Faster, Cheaper)</div>
          </div>
        </div>
        
        {/* Process Data */}
        {submittedData.map((row, index) => {
          const employee = employees.find(emp => emp.id === row.employee_id);
          return (
            <div key={`process-${index}`} className="grid grid-cols-3 border-b border-gray-300">
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                </span>
              </div>
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">{row.process_name}</span>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {row.kpi_list ? (
                    <ul className="list-disc list-inside space-y-1">
                      {row.kpi_list.split('\n').filter(kpi => kpi.trim()).map((kpi, kpiIndex) => (
                        <li key={kpiIndex} className="text-sm">{kpi.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">No KPIs specified</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-orange-400 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl">
            <span className="font-bold">People:</span> Process Accountability Chart (PACe)
          </h1>
        </div>
        {hasSubmittedData && (
          <div className="flex items-center space-x-3">
            <span className="text-sm">
              {isEditMode ? 'Editing Mode' : 'View Mode'}
            </span>
            <button
              onClick={handleEditModeToggle}
              className="bg-white text-orange-400 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              {isEditMode ? 'Switch to View' : 'Edit Form'}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 border-l border-r border-gray-300">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            1
          </div>
          <span className="text-sm">Identify 4 to 9 processes that drive your business.</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            2
          </div>
          <span className="text-sm">Assign someone specific accountability for each process.</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            3
          </div>
          <span className="text-sm">List Key Performance Indicators (KPIs) for each process (better, faster, cheaper).</span>
        </div>
      </div>

      {/* Show read-only view when not in edit mode */}
      {!isEditMode && hasSubmittedData ? (
        <div>
          {renderReadOnlyView()}
          
          {/* Status Messages in View Mode */}
          {submitStatus && (
            <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
              <div className={`text-sm ${submitStatus.startsWith('Form') ? 'text-green-600' : 'text-red-600'}`}>
                {submitStatus}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>

        {/* Table */}
        <div className="border border-gray-300">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300">
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                1
              </div>
              <div className="font-semibold text-sm text-center">
                Person Accountable
              </div>
            </div>
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                2
              </div>
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 right-0 transform translate-x-1/2">
                3
              </div>
              <div className="font-semibold text-sm text-center">
                Name of Process
              </div>
            </div>
            <div className="p-3 relative">
              <div className="font-semibold text-sm text-center">KPIs<br />(Better, Faster, Cheaper)</div>
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
      )}

      {/* Footer */}
      <div className="bg-gray-50 p-4 border border-gray-300 rounded-b-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
        </div>  
      </div>
    </div>
  );
};

export default PaceForm;
