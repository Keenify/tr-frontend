import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useEmployees, ExtendedEmployee } from '../hooks/useEmployees';
import { FaceFormValues, FaceFormRow, FaceFormDatabaseRow, BusinessUnitRow as BusinessUnitRowType } from '../types/faceFormTypes';
import FaceFormRowComponent from './FaceFormRow';
import BusinessUnitRow from './BusinessUnitRow';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../shared/hooks/useSession';

const MIN_ROWS = 1; // At least 1 function required
const MAX_ROWS = 20;
const MIN_BU_ROWS = 4;
const MAX_BU_ROWS = 10;

// Predefined functions
const PREDEFINED_FUNCTIONS = [
  'Head of Company',
  'Marketing',
  'R&D/Innovation',
  'Sales',
  'Operations',
  'Treasury',
  'Controller',
  'Information Technology',
  'Human Resources',
  'Talent Development/Learning',
  'Customer Advocacy'
];

const FaceForm: React.FC = () => {
  // State for loading and submit status
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  // Get session and company data
  const { session } = useSession();
  const userId = session?.user?.id;
  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  
  // React Hook Form setup
  const { control, handleSubmit, watch, reset, setValue } = useForm<FaceFormValues>({
    defaultValues: {
      company_id: companyInfo?.id || '',
      functions: PREDEFINED_FUNCTIONS.map(func => ({
        function_name: func,
        accountable_employee_id: '',
        kpi_list: '',
        outcome_list: '',
        business_unit_name: '',
        head_employee_id: '',
      })),
      business_units: Array(MIN_BU_ROWS).fill({
        business_unit_name: '',
        head_employee_id: '',
        kpi_list: '',
        outcome_list: '',
      }),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'functions',
  });

  const { fields: businessUnitFields, append: appendBusinessUnit, remove: removeBusinessUnit } = useFieldArray({
    control,
    name: 'business_units',
  });

  const selectedCompanyId = companyInfo?.id || '';
  const employees: ExtendedEmployee[] = useEmployees(selectedCompanyId);

  // Set company_id when companyInfo is available
  React.useEffect(() => {
    if (companyInfo?.id) {
      setValue('company_id', companyInfo.id);
    }
  }, [companyInfo?.id, setValue]);

  // Add a new function row
  const handleAddRow = () => {
    if (fields.length < MAX_ROWS) {
      append({
        function_name: '',
        accountable_employee_id: '',
        kpi_list: '',
        outcome_list: '',
        business_unit_name: '',
        head_employee_id: '',
      });
    }
  };

  // Remove a function row (allow removing any function as long as MIN_ROWS is maintained)
  const handleRemoveRow = (idx: number) => {
    if (fields.length > MIN_ROWS) {
      remove(idx);
    }
  };

  // Add a new business unit row
  const handleAddBusinessUnitRow = () => {
    if (businessUnitFields.length < MAX_BU_ROWS) {
      appendBusinessUnit({
        business_unit_name: '',
        head_employee_id: '',
        kpi_list: '',
        outcome_list: '',
      });
    }
  };

  // Remove a business unit row
  const handleRemoveBusinessUnitRow = (idx: number) => {
    if (businessUnitFields.length > MIN_BU_ROWS) {
      removeBusinessUnit(idx);
    }
  };

  // Form submission handler - simplified to match PaceForm pattern
  const onSubmit = async (values: FaceFormValues) => {
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
      // Prepare function rows for insertion
      const functionRows = values.functions
        .filter(row => row.accountable_employee_id && row.function_name.trim() && row.kpi_list?.trim() && row.outcome_list?.trim()) // Only submit rows with all required data
        .map((row) => ({
          company_id: companyInfo.id,
          employee_id: userInfo.id, // Use actual employee ID, not auth user ID
          function_name: row.function_name.trim(),
          accountable_employee_id: row.accountable_employee_id,
          kpi_list: row.kpi_list.trim(),
          outcome_list: row.outcome_list.trim(),
        }));

      // Prepare business unit rows for insertion
      const businessUnitRows = values.business_units
        .filter(row => row.head_employee_id && row.business_unit_name.trim() && row.kpi_list?.trim() && row.outcome_list?.trim()) // Only submit rows with all required data
        .map((row) => ({
          company_id: companyInfo.id,
          employee_id: userInfo.id, // Use actual employee ID, not auth user ID
          function_name: row.business_unit_name.trim(),
          accountable_employee_id: row.head_employee_id,
          kpi_list: row.kpi_list.trim(),
          outcome_list: row.outcome_list.trim(),
        }));

      // Combine all rows
      const allRows = [...functionRows, ...businessUnitRows];
      
      if (allRows.length === 0) {
        setSubmitStatus('Please fill in at least one function or business unit with all required information: Person Accountable, Leading Indicators (KPIs), and Results/Outcomes');
        return;
      }
      
      console.log('Submitting face form data:', allRows);
      
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
      console.log('Employee ID:', userInfo.id);
      console.log('Inserting with authenticated session');
      
      // First, let's try to check the table structure
      console.log('Attempting to check table structure...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('face_form')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Table check error:', tableError);
      } else {
        console.log('Table check result:', tableCheck);
      }
      
      // Try basic insert first - only with required fields
      console.log('Attempting basic insert with original rows:', allRows);
      
      // Insert data with current authenticated session context
      const { data, error } = await supabase
        .from('face_form')
        .insert(allRows)
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Failed rows data:', allRows);
        console.error('Current user session:', {
          userId: currentSession.session.user.id,
          employeeId: userInfo.id,
          email: currentSession.session.user.email,
          role: currentSession.session.user.role
        });
        throw new Error(`Database insert failed: ${error.message} (Code: ${error.code})`);
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
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-orange-400 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl">
            <span className="font-bold">People:</span> Function Accountability Chart (FaCe)
          </h1>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 border-l border-r border-gray-300">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            1
          </div>
          <span className="text-sm">Name the person accountable for each function</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            2
          </div>
          <span className="text-sm">Ask the four questions at the bottom of the page re: whose name(s) you listed for each function</span>
        </div>
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            3
          </div>
          <span className="text-sm">List Key Performance Indicators (KPIs) for each function</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            4
          </div>
          <span className="text-sm">Take your Profit and Loss (P/L), Balance Sheet (B/S), and Cash Flow accounting statements and assign a person to each line item, then derive appropriate Results/Outcomes for each function</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Table */}
        <div className="border border-gray-300">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300">
            <div className="p-3 border-r border-gray-300 relative">
              <div className="font-semibold text-sm text-center">
                Functions
              </div>
            </div>
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                1
              </div>
              <div className="font-semibold text-sm text-center">
                Person<br />Accountable
              </div>
            </div>
            <div className="p-3 border-r border-gray-300 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                3
              </div>
              <div className="font-semibold text-sm text-center">
                Leading Indicators<br />
                <span className="text-xs text-gray-600">(Key Performance Indicators)</span>
              </div>
            </div>
            <div className="p-3 relative">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold absolute -top-2 left-0 transform -translate-x-1/2">
                4
              </div>
              <div className="font-semibold text-sm text-center">
                Results/Outcomes<br />
                <span className="text-xs text-gray-600">(P/L or B/S Items)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Rows */}
          {fields.map((field, idx) => (
            <FaceFormRowComponent
              key={field.id}
              idx={idx}
              field={field}
              control={control}
              employees={employees}
              selectedCompanyId={selectedCompanyId}
              fieldsLength={fields.length}
              minRows={MIN_ROWS}
              onRemove={handleRemoveRow}
              isPredefinedFunction={false}
            />
          ))}

          {/* Heads of Business Units Header */}
          <div className="grid grid-cols-4 border-b border-gray-300 bg-gray-100">
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">
                Heads of Business Units
              </div>
            </div>
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">
                Person<br />Accountable
              </div>
            </div>
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">
                Leading Indicators<br />
                <span className="text-xs text-gray-600">(Key Performance Indicators)</span>
              </div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm text-center">
                Results/Outcomes<br />
                <span className="text-xs text-gray-600">(P/L or B/S Items)</span>
              </div>
            </div>
          </div>

          {/* Business Unit Rows */}
          {businessUnitFields.map((field, idx) => (
            <BusinessUnitRow
              key={field.id}
              idx={idx}
              field={field}
              control={control}
              employees={employees}
              selectedCompanyId={selectedCompanyId}
              fieldsLength={businessUnitFields.length}
              minRows={MIN_BU_ROWS}
              onRemove={handleRemoveBusinessUnitRow}
            />
          ))}
        </div>

        {/* Add Row Buttons */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300 space-x-3">
          {fields.length < MAX_ROWS && (
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              + Add Function
            </button>
          )}
          {businessUnitFields.length < MAX_BU_ROWS && (
            <button
              type="button"
              onClick={handleAddBusinessUnitRow}
              className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              + Add Business Unit
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
      <div className="bg-purple-600 p-4 border border-gray-300 rounded-b-lg text-white">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            2
          </div>
          <span className="text-sm font-medium">Identify: 1. More than 1 Person in a Seat; 2. Person in more than 1 seat; 3. Empty seats; 4. Enthusiastically Rehire?</span>
        </div>
      </div>
    </div>
  );
};

export default FaceForm;