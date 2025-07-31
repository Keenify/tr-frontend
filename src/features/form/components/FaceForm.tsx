import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useEmployees, ExtendedEmployee } from '../hooks/useEmployees';
import { FaceFormValues, FaceFormRow, FaceFormDatabaseRow, BusinessUnitRow } from '../types/faceFormTypes';
import FaceFormRowComponent from './FaceFormRow';
import BusinessUnitRowComponent from './BusinessUnitRow';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../shared/hooks/useSession';

const MIN_ROWS = 1; // At least 1 function required
const MAX_ROWS = 20;
const MIN_BU_ROWS = 4;
const MAX_BU_ROWS = 10;

// Predefined functions
const PREDEFINED_FUNCTIONS = [
  'Head of Company',
  'CEO',
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

// Helper function to determine if a function name should be categorized as a predefined function
const isPredefinedFunction = (functionName: string): boolean => {
  const normalizedName = functionName.trim().toLowerCase();
  
  // Check exact matches first
  if (PREDEFINED_FUNCTIONS.some(func => func.toLowerCase() === normalizedName)) {
    return true;
  }
  
  // Check for common variations
  const functionVariations: { [key: string]: string[] } = {
    'ceo': ['chief executive officer', 'chief executive', 'ceo'],
    'head of company': ['head of company', 'company head', 'ceo', 'chief executive officer'],
    'marketing': ['marketing', 'marketing head', 'head of marketing', 'marketing director'],
    'sales': ['sales', 'sales head', 'head of sales', 'sales director', 'sales manager'],
    'operations': ['operations', 'operations head', 'head of operations', 'operations director', 'ops'],
    'human resources': ['human resources', 'hr', 'head of hr', 'hr director', 'human resources director'],
    'information technology': ['information technology', 'it', 'head of it', 'it director', 'technology'],
    'treasury': ['treasury', 'treasurer', 'head of treasury', 'finance'],
    'controller': ['controller', 'financial controller', 'finance controller']
  };
  
  // Check if the function name matches any variation
  for (const [baseFunction, variations] of Object.entries(functionVariations)) {
    if (variations.some(variation => variation === normalizedName)) {
      return true;
    }
  }
  
  return false;
};

const FaceForm: React.FC = () => {
  // State for loading and submit status
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  // New states for view/edit mode and data persistence
  const [isEditMode, setIsEditMode] = useState(true);
  const [hasSubmittedData, setHasSubmittedData] = useState(false);
  const [submittedData, setSubmittedData] = useState<FaceFormDatabaseRow[]>([]);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // Get session and company data
  const { session } = useSession();
  const userId = session?.user?.id;
  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  
  // React Hook Form setup
  const { control, handleSubmit, setValue, watch } = useForm<FaceFormValues>({
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

  // Load existing form data on mount
  const loadExistingData = async () => {
    if (!companyInfo?.id) return;
    
    setLoadingExistingData(true);
    try {
      const { data, error } = await supabase
        .from('face_form')
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
  const populateFormWithExistingData = (data: FaceFormDatabaseRow[]) => {
    const functionData: FaceFormRow[] = [];
    const businessUnitData: BusinessUnitRow[] = [];
    
    data.forEach(row => {
      // Check if it's a predefined function or business unit
      const isFunction = isPredefinedFunction(row.function_name);
      
      if (isFunction) {
        functionData.push({
          function_name: row.function_name,
          accountable_employee_id: row.accountable_employee_id,
          kpi_list: row.kpi_list,
          outcome_list: row.outcome_list,
          business_unit_name: '',
          head_employee_id: '',
        });
      } else {
        businessUnitData.push({
          business_unit_name: row.function_name,
          head_employee_id: row.accountable_employee_id,
          kpi_list: row.kpi_list,
          outcome_list: row.outcome_list,
        });
      }
    });
    
    // Update functions array with existing data
    const updatedFunctions = PREDEFINED_FUNCTIONS.map(func => {
      const existingData = functionData.find(f => f.function_name === func);
      return existingData || {
        function_name: func,
        accountable_employee_id: '',
        kpi_list: '',
        outcome_list: '',
        business_unit_name: '',
        head_employee_id: '',
      };
    });
    
    setValue('functions', updatedFunctions);
    
    // Update business units array with existing data
    const minBusinessUnits = Math.max(businessUnitData.length, MIN_BU_ROWS);
    const updatedBusinessUnits: BusinessUnitRow[] = Array(minBusinessUnits).fill(null).map((_, index) => {
      return businessUnitData[index] || {
        business_unit_name: '',
        head_employee_id: '',
        kpi_list: '',
        outcome_list: '',
      };
    });
    
    setValue('business_units', updatedBusinessUnits);
  };

  // Load existing data when component mounts and company info is available
  useEffect(() => {
    if (companyInfo?.id && !loadingExistingData) {
      loadExistingData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyInfo?.id]);


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

  // Form submission handler - with proper validation
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
      // Validate functions - check for incomplete rows before filtering
      const incompleteFunctions: string[] = [];
      const validFunctionRows: any[] = [];
      
      values.functions.forEach((row, index) => {
        // Check if row has any data filled
        const hasData = row.accountable_employee_id || row.kpi_list?.trim() || row.outcome_list?.trim();
        
        if (hasData) {
          // Add row with whatever data is available
          validFunctionRows.push({
            company_id: companyInfo.id,
            employee_id: userInfo.id,
            function_name: row.function_name.trim(),
            accountable_employee_id: row.accountable_employee_id || '',
            kpi_list: row.kpi_list?.trim() || '',
            outcome_list: row.outcome_list?.trim() || '',
          });
        }
      });

      // Validate business units - check for incomplete rows before filtering
      const incompleteBusinessUnits: string[] = [];
      const validBusinessUnitRows: any[] = [];
      
      values.business_units.forEach((row, index) => {
        // Check if row has any data filled
        const hasData = row.head_employee_id || row.business_unit_name?.trim() || row.kpi_list?.trim() || row.outcome_list?.trim();
        
        if (hasData && row.business_unit_name?.trim()) {
          // Add row with whatever data is available (business unit name is still required)
          validBusinessUnitRows.push({
            company_id: companyInfo.id,
            employee_id: userInfo.id,
            function_name: row.business_unit_name.trim(),
            accountable_employee_id: row.head_employee_id || '',
            kpi_list: row.kpi_list?.trim() || '',
            outcome_list: row.outcome_list?.trim() || '',
          });
        }
      });

      // Combine all valid rows
      const allRows = [...validFunctionRows, ...validBusinessUnitRows];
      
      // Check if at least one function has a person accountable assigned
      const hasAtLeastOneAccountable = allRows.some(row => row.accountable_employee_id && row.accountable_employee_id.trim() !== '');
      
      if (allRows.length === 0) {
        setSubmitStatus('Please fill in at least one function or business unit with some information.');
        setLoading(false);
        return;
      }
      
      if (!hasAtLeastOneAccountable) {
        setSubmitStatus('Please assign at least one person accountable to a function before submitting.');
        setLoading(false);
        return;
      }
      
      // Check for duplicate submission
      if (hasSubmittedData && submittedData.length > 0) {
        const isDuplicate = checkForDuplicateData(allRows, submittedData);
        if (isDuplicate) {
          setSubmitStatus('This entry is already captured in the database. No changes detected.');
          setLoading(false);
          return;
        }
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
      
      // Use upsert to handle duplicates and potential RLS issues
      const { data, error } = await supabase
        .from('face_form')
        .upsert(allRows, { onConflict: 'company_id,function_name' })
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
      setSubmittedData(allRows);
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

  // Function to check for duplicate data
  const checkForDuplicateData = (newRows: any[], existingRows: FaceFormDatabaseRow[]): boolean => {
    if (newRows.length !== existingRows.length) {
      return false;
    }
    
    // Sort both arrays by function_name for comparison
    const sortedNew = [...newRows].sort((a, b) => a.function_name.localeCompare(b.function_name));
    const sortedExisting = [...existingRows].sort((a, b) => a.function_name.localeCompare(b.function_name));
    
    // Compare each row
    for (let i = 0; i < sortedNew.length; i++) {
      const newRow = sortedNew[i];
      const existingRow = sortedExisting[i];
      
      if (
        newRow.function_name !== existingRow.function_name ||
        newRow.accountable_employee_id !== existingRow.accountable_employee_id ||
        (newRow.kpi_list || '') !== (existingRow.kpi_list || '') ||
        (newRow.outcome_list || '') !== (existingRow.outcome_list || '')
      ) {
        return false;
      }
    }
    
    return true;
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
    
    const functions = submittedData.filter(row => isPredefinedFunction(row.function_name));
    const businessUnits = submittedData.filter(row => !isPredefinedFunction(row.function_name));
    
    return (
      <div className="border border-gray-300 bg-gray-50">
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-gray-200 border-b border-gray-300">
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">Functions</div>
          </div>
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">Person Accountable</div>
          </div>
          <div className="p-3 border-r border-gray-300">
            <div className="font-semibold text-sm text-center">Leading Indicators (KPIs)</div>
          </div>
          <div className="p-3">
            <div className="font-semibold text-sm text-center">Results/Outcomes</div>
          </div>
        </div>
        
        {/* Functions Data */}
        {functions.map((row, index) => {
          const employee = employees.find(emp => emp.id === row.accountable_employee_id);
          return (
            <div key={`function-${index}`} className="grid grid-cols-4 border-b border-gray-300">
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">{row.function_name}</span>
              </div>
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                </span>
              </div>
              <div className="p-3 border-r border-gray-300">
                <div className="text-sm">
                  {row.kpi_list ? (
                    <ul className="list-disc list-inside space-y-1">
                      {row.kpi_list.split('\n').filter(item => item.trim()).map((item, idx) => (
                        <li key={idx} className="text-sm">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No KPIs specified</span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {row.outcome_list ? (
                    <ul className="list-disc list-inside space-y-1">
                      {row.outcome_list.split('\n').filter(item => item.trim()).map((item, idx) => (
                        <li key={idx} className="text-sm">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No outcomes specified</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Business Units Header */}
        {businessUnits.length > 0 && (
          <div className="grid grid-cols-4 border-b border-gray-300 bg-gray-200">
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">Heads of Business Units</div>
            </div>
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">Person Accountable</div>
            </div>
            <div className="p-3 border-r border-gray-300">
              <div className="font-semibold text-sm text-center">Leading Indicators (KPIs)</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm text-center">Results/Outcomes</div>
            </div>
          </div>
        )}
        
        {/* Business Units Data */}
        {businessUnits.map((row, index) => {
          const employee = employees.find(emp => emp.id === row.accountable_employee_id);
          return (
            <div key={`business-unit-${index}`} className="grid grid-cols-4 border-b border-gray-300">
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">{row.function_name}</span>
              </div>
              <div className="p-3 border-r border-gray-300">
                <span className="text-sm">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                </span>
              </div>
              <div className="p-3 border-r border-gray-300">
                <div className="text-sm">
                  {row.kpi_list ? (
                    <ul className="list-disc list-inside space-y-1">
                      {row.kpi_list.split('\n').filter(item => item.trim()).map((item, idx) => (
                        <li key={idx} className="text-sm">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No KPIs specified</span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {row.outcome_list ? (
                    <ul className="list-disc list-inside space-y-1">
                      {row.outcome_list.split('\n').filter(item => item.trim()).map((item, idx) => (
                        <li key={idx} className="text-sm">{item.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm italic">No outcomes specified</span>
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
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-orange-400 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl">
            <span className="font-bold">People:</span> Function Accountability Chart (FACe)
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

      {/* Show read-only view when not in edit mode */}
      {!isEditMode && hasSubmittedData ? (
        <div>
          {renderReadOnlyView()}
          
          {/* Status Messages in View Mode */}
          {submitStatus && (
            <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
              <div className={`text-sm ${submitStatus.startsWith('Form') ? 'text-green-600' : 'text-red-600'}`}>
                {submitStatus.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
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
          <div className="grid grid-cols-4 border-b border-gray-300 bg-gray-200">
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
            <BusinessUnitRowComponent
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
              {submitStatus.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </form>
      )}

      {/* Footer */}
      <div className="bg-purple-600 p-4 border border-gray-300 rounded-b-lg text-white">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0">
            2
          </div>
          <span className="text-sm font-medium">
            Identify: 1. More than 1 Person in a Seat; 2. Person in more than 1 seat; 3. Empty seats; 4. Enthusiastically Rehire?
          </span>
        </div>
      </div>
    </div>
  );
};

export default FaceForm;