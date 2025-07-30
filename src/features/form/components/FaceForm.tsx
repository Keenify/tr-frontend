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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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
        enthusiastically_rehire: true,
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
        enthusiastically_rehire: true,
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

  // Helper function to translate database errors to user-friendly messages
  const translateErrorMessage = (error: any): string => {
    if (error.code === '23514') {
      if (error.message.includes('check_kpi_not_empty')) {
        return 'All submitted rows must have Key Performance Indicators (KPIs) filled in. Please ensure the "Leading Indicators" field is not empty for each function or business unit you want to submit.';
      }
      if (error.message.includes('check_outcome_not_empty')) {
        return 'All submitted rows must have Results/Outcomes filled in. Please ensure the "Results/Outcomes" field is not empty for each function or business unit you want to submit.';
      }
      return 'Some required fields are missing. Please fill in all required information before submitting.';
    }
    if (error.code === '23505') {
      if (error.message.includes('unique_function_per_company')) {
        return 'Duplicate function detected. Each function can only be assigned once per company. Please check that you haven\'t already submitted this form, or remove any duplicate function entries before submitting again.';
      }
      return 'Duplicate entry detected. Please check for duplicate information and try again.';
    }
    if (error.code === '22P02') {
      return 'Invalid data format detected. Please check that all fields are filled in correctly.';
    }
    if (error.message?.includes('RLS') || error.message?.includes('row-level security') || error.message?.includes('policy')) {
      return 'You do not have permission to perform this action. This might be due to: 1) Not being logged in properly, 2) Not having access to the company data, or 3) Missing required user permissions. Please refresh the page and try again, or contact support.';
    }
    return `An error occurred: ${error.message}`;
  };

  // Form submission handler
  const onSubmit = async (values: FaceFormValues) => {
    if (!companyInfo?.id) {
      setErrorMessage('Company information not available');
      setShowErrorModal(true);
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
          employee_id: userId, // Who submitted this form
          function_name: row.function_name.trim(),
          accountable_employee_id: row.accountable_employee_id,
          kpi_list: row.kpi_list.trim(),
          outcome_list: row.outcome_list.trim(),
          business_unit_name: null, // Use null instead of empty string for UUID columns
          head_employee_id: null, // Use null instead of empty string for UUID columns
          enthusiastically_rehire: row.enthusiastically_rehire,
        }));

      // Prepare business unit rows for insertion
      const businessUnitRows = values.business_units
        .filter(row => row.head_employee_id && row.business_unit_name.trim() && row.kpi_list?.trim() && row.outcome_list?.trim()) // Only submit rows with all required data
        .map((row) => ({
          company_id: companyInfo.id,
          employee_id: userId, // Who submitted this form
          function_name: row.business_unit_name.trim(),
          accountable_employee_id: row.head_employee_id,
          kpi_list: row.kpi_list.trim(),
          outcome_list: row.outcome_list.trim(),
          business_unit_name: row.business_unit_name.trim(),
          head_employee_id: row.head_employee_id,
          enthusiastically_rehire: true,
        }));

      // Combine all rows
      const allRows = [...functionRows, ...businessUnitRows];
      
      if (allRows.length === 0) {
        setErrorMessage('Please fill in at least one function or business unit with all required information:\n\n• Person Accountable\n• Leading Indicators (KPIs)\n• Results/Outcomes\n\nAll fields must be completed to submit.');
        setShowErrorModal(true);
        return;
      }
      
      // Validate that all rows have required fields
      const invalidRows = allRows.filter(row => !row.company_id);
      if (invalidRows.length > 0) {
        console.error('Invalid rows detected (missing company_id):', invalidRows);
        setErrorMessage('Company information missing. Please refresh the page and try again.');
        setShowErrorModal(true);
        return;
      }
      
      console.log('Submitting face form data:', allRows);
      
      // Verify user is authenticated
      if (!userId) {
        setErrorMessage('User not authenticated. Please log in again.');
        setShowErrorModal(true);
        return;
      }
      
      // Verify company access
      if (!companyInfo?.id) {
        setErrorMessage('Company information not available. Please refresh the page or contact support.');
        setShowErrorModal(true);
        return;
      }
      
      // Ensure user session is set before database operation
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setErrorMessage('Failed to get session. Please log in again.');
        setShowErrorModal(true);
        return;
      }
      
      if (!currentSession?.session) {
        setErrorMessage('No active session found. Please log in again.');
        setShowErrorModal(true);
        return;
      }
      
      console.log('Current user ID:', currentSession.session.user.id);
      console.log('Inserting with authenticated session');
      
      // Debug: Check if user exists in employees table and get their company_id
      console.log('Checking user in employees table...');
      console.log('Looking for user ID:', currentSession.session.user.id);
      
      const { data: userEmployees, error: userEmployeeError } = await supabase
        .from('employees')
        .select('id, company_id, first_name, last_name, email')
        .eq('id', currentSession.session.user.id);
      
      if (userEmployeeError) {
        console.error('User employee check error:', userEmployeeError);
        setErrorMessage(`Error checking employee table: ${userEmployeeError.message}`);
        setShowErrorModal(true);
        return;
      }
      
      console.log('Employee query result:', userEmployees);
      console.log('Number of employees found:', userEmployees?.length || 0);
      
      if (!userEmployees || userEmployees.length === 0) {
        console.error('No employee record found for user:', currentSession.session.user.id);
        setErrorMessage(`Your user account (${currentSession.session.user.email}) is not linked to any employee record. Please contact your administrator to add you to the employees table.`);
        setShowErrorModal(true);
        return;
      }
      
      if (userEmployees.length > 1) {
        console.error('Multiple employee records found for user:', currentSession.session.user.id);
        console.error('Employee records:', userEmployees);
        setErrorMessage(`Multiple employee records found for your account. Please contact your administrator to resolve this data inconsistency.`);
        setShowErrorModal(true);
        return;
      }
      
      const userEmployee = userEmployees[0];
      console.log('User employee data:', userEmployee);
      console.log('User company_id:', userEmployee.company_id);
      console.log('Form company_id:', companyInfo.id);
      
      // Check if user's company matches form company
      if (userEmployee.company_id !== companyInfo.id) {
        console.error('Company mismatch:', { userCompany: userEmployee.company_id, formCompany: companyInfo.id });
        setErrorMessage(`Access denied: You don't have permission to submit data for this company. Your employee record is linked to a different company.`);
        setShowErrorModal(true);
        return;
      }
      
      // Debug: Test RLS policy by trying a simple select first
      console.log('Testing RLS policy with SELECT...');
      const { data: testSelect, error: testSelectError } = await supabase
        .from('face_form')
        .select('*')
        .eq('company_id', companyInfo.id)
        .limit(1);
      
      if (testSelectError) {
        console.error('RLS SELECT test failed:', testSelectError);
        setErrorMessage(`RLS SELECT test failed: ${testSelectError.message}. This indicates a policy issue.`);
        setShowErrorModal(true);
        return;
      } else {
        console.log('RLS SELECT test passed:', testSelect);
      }
      
      // Try basic insert with comprehensive logging
      console.log('Attempting insert with rows:', allRows);
      console.log('Sample row being inserted:', allRows[0]);
      console.log('Auth uid():', currentSession.session.user.id);
      console.log('Expected company_id in policy:', companyInfo.id);
      
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
          email: currentSession.session.user.email,
          role: currentSession.session.user.role
        });
        
        // Additional debugging for RLS
        if (error.message?.includes('policy') || error.message?.includes('RLS') || error.message?.includes('row-level security')) {
          console.error('RLS Policy violation details:');
          console.error('- Current user ID (auth.uid()):', currentSession.session.user.id);
          console.error('- Company ID being inserted:', companyInfo.id);
          console.error('- User employee record company_id:', userEmployee?.company_id);
          
          // Test the policy condition manually
          console.log('Testing policy condition manually...');
          const { data: policyTest, error: policyTestError } = await supabase
            .from('employees')
            .select('company_id')
            .eq('id', currentSession.session.user.id);
          
          console.log('Policy test result:', policyTest);
          if (policyTestError) {
            console.error('Policy test error:', policyTestError);
          }
        }
        
        const userFriendlyError = translateErrorMessage(error);
        setErrorMessage(userFriendlyError);
        setShowErrorModal(true);
        return;
      }
      
      console.log('Successfully inserted data:', data);
      
      setSubmitStatus('Form submitted successfully!');
      reset();
    } catch (err: unknown) {
      console.error('Form submission error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setErrorMessage('Submission failed: ' + errorMsg);
      setShowErrorModal(true);
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
          {submitStatus && submitStatus.startsWith('Form') && (
            <div className="mt-3 text-sm text-green-600">
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

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceForm;