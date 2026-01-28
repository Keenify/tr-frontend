import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import { useEmployees, ExtendedEmployee } from '../hooks/useEmployees';
import { FaceFormValues, FaceFormRow, FaceFormDatabaseRow, BusinessUnitRow } from '../types/faceFormTypes';
import FaceFormRowComponent from './FaceFormRow';
import BusinessUnitRowComponent from './BusinessUnitRow';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useSession } from '../../../shared/hooks/useSession';

const MIN_ROWS = 1; // At least 1 function required for the form to be submitted
const MAX_ROWS = 20;
const MIN_BU_ROWS = 0; // Allow removing all business units
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
  for (const [, variations] of Object.entries(functionVariations)) {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<FaceFormValues | null>(null);

  // State to track removed functions persistently
  const [removedFunctions, setRemovedFunctions] = useState<string[]>([]);
  
  // Get session and company data
  const { session } = useSession();
  const userId = session?.user?.id;
  const { companyInfo, userInfo, isLoading: userDataLoading } = useUserAndCompanyData(userId || '');
  
  // Load removed functions from localStorage on mount
  useEffect(() => {
    if (companyInfo?.id) {
      const storageKey = `faceform_removed_functions_${companyInfo.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const removedFuncs = JSON.parse(stored);
          setRemovedFunctions(removedFuncs);
        } catch (e) {
          console.error('Error parsing removed functions from localStorage:', e);
        }
      }
    }
  }, [companyInfo?.id]);
  
  // Save removed functions to localStorage whenever it changes
  useEffect(() => {
    if (companyInfo?.id && removedFunctions.length > 0) {
      const storageKey = `faceform_removed_functions_${companyInfo.id}`;
      localStorage.setItem(storageKey, JSON.stringify(removedFunctions));
    }
  }, [removedFunctions, companyInfo?.id]);
  
  // React Hook Form setup
  const { control, handleSubmit, setValue, watch, formState } = useForm<FaceFormValues>({
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
      business_units: [],
    },
  });
  
  // Watch for form changes
  const watchedValues = watch();

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
      // Use is_business_unit flag to distinguish between functions and business units
      if (row.is_business_unit) {
        businessUnitData.push({
          business_unit_name: row.function_name,
          head_employee_id: row.accountable_employee_id || '',
          kpi_list: row.kpi_list,
          outcome_list: row.outcome_list,
        });
      } else {
        functionData.push({
          function_name: row.function_name,
          accountable_employee_id: row.accountable_employee_id || '',
          kpi_list: row.kpi_list,
          outcome_list: row.outcome_list,
          business_unit_name: '',
          head_employee_id: '',
        });
      }
    });
    
    // Update functions array with only the functions that exist in the database
    const updatedFunctions = functionData.filter(f => 
      !removedFunctions.includes(f.function_name)
    );
    
    setValue('functions', updatedFunctions);
    
    // Update business units array with existing data
    const updatedBusinessUnits: BusinessUnitRow[] = businessUnitData.length > 0 ? businessUnitData : [];
    
    setValue('business_units', updatedBusinessUnits);
    
    // Set original form data for change tracking
    setOriginalFormData({
      company_id: companyInfo.id,
      functions: updatedFunctions,
      business_units: updatedBusinessUnits,
    });
  };

  // Update form when removed functions change
  useEffect(() => {
    if (removedFunctions.length > 0) {
      // Get current form values
      const currentValues = watch();
      // Filter out removed functions
      const filteredFunctions = currentValues.functions?.filter(
        (func: any) => !removedFunctions.includes(func.function_name)
      ) || [];
      // Update the form
      setValue('functions', filteredFunctions);
    }
  }, [removedFunctions, setValue, watch]);
  
  // Load existing data when component mounts and company info is available
  useEffect(() => {
    if (companyInfo?.id && !loadingExistingData) {
      loadExistingData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyInfo?.id]);
  
  // Track form changes
  useEffect(() => {
    if (isEditMode) {
      if (originalFormData) {
        // For existing data, check if there are changes
        const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(originalFormData);
        setHasUnsavedChanges(hasChanges);
      } else {
        // For new forms (no existing data), always allow submission if user has filled something
        const hasContent = watchedValues.functions?.some(f => f.accountable_employee_id || f.kpi_list || f.outcome_list) ||
                          watchedValues.business_units?.some(bu => bu.business_unit_name || bu.head_employee_id);
        setHasUnsavedChanges(hasContent);
      }
    }
  }, [watchedValues, originalFormData, isEditMode]);

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

  // Remove a function row and track it persistently
  const handleRemoveRow = (idx: number) => {
    if (fields.length > MIN_ROWS) {
      const functionToRemove = fields[idx].function_name;
      // Add to removed functions list to persist across refreshes
      if (PREDEFINED_FUNCTIONS.includes(functionToRemove)) {
        setRemovedFunctions(prev => {
          const newRemoved = [...prev, functionToRemove];
          // Save to localStorage immediately
          if (companyInfo?.id) {
            const storageKey = `faceform_removed_functions_${companyInfo.id}`;
            localStorage.setItem(storageKey, JSON.stringify(newRemoved));
          }
          return newRemoved;
        });
      }
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

  // Remove a business unit row (allow removing all)
  const handleRemoveBusinessUnitRow = (idx: number) => {
    removeBusinessUnit(idx);
  };
  
  // Remove all business units
  const handleRemoveAllBusinessUnits = () => {
    // Remove all business units
    for (let i = businessUnitFields.length - 1; i >= 0; i--) {
      removeBusinessUnit(i);
    }
  };

  // Form submission handler - with proper validation
  const onSubmit = async (values: FaceFormValues) => {
    console.log('DEBUG - onSubmit called with:', values);
    console.log('DEBUG - formState.errors:', formState.errors);
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
      // Validate functions - check if KPI/result requires person accountable
      const functionValidationErrors: string[] = [];
      values.functions.forEach((row, index) => {
        const hasKpiOrResult = (row.kpi_list?.trim() || row.outcome_list?.trim());
        if (hasKpiOrResult && !row.accountable_employee_id) {
          const functionName = row.function_name?.trim() || `Function ${index + 1}`;
          functionValidationErrors.push(`${functionName}: Person accountable is required when KPI or result is entered`);
        }
      });

      // Validate business units - check if KPI/result requires head of business unit
      const businessUnitValidationErrors: string[] = [];
      values.business_units.forEach((row) => {
        if (row.business_unit_name?.trim()) {
          const hasKpiOrResult = (row.kpi_list?.trim() || row.outcome_list?.trim());
          if (hasKpiOrResult && !row.head_employee_id) {
            businessUnitValidationErrors.push(`${row.business_unit_name}: Head of business unit is required when KPI or result is entered`);
          }
        }
      });

      // Show validation errors if any
      const allValidationErrors = [...functionValidationErrors, ...businessUnitValidationErrors];
      if (allValidationErrors.length > 0) {
        setSubmitStatus('Validation Error:\n' + allValidationErrors.join('\n'));
        setLoading(false);
        return;
      }

      // First, check if we have at least one function with a person accountable
      const functionsWithPerson = values.functions.filter(row => row.accountable_employee_id);
      const hasAtLeastOnePersonAccountable = functionsWithPerson.length > 0;
      
      // Filter and validate functions
      const validFunctionRows: FaceFormDatabaseRow[] = [];
      
      values.functions.forEach((row) => {
        // Only include functions that have a person accountable (ignore empty ones)
        if (row.accountable_employee_id && row.function_name?.trim()) {
          validFunctionRows.push({
            company_id: companyInfo.id,
            employee_id: userInfo.id,
            function_name: row.function_name.trim(),
            accountable_employee_id: row.accountable_employee_id,
            kpi_list: row.kpi_list?.trim() || '',
            outcome_list: row.outcome_list?.trim() || '',
            is_business_unit: false,
          });
        }
      });

      // Filter and validate business units (make heads optional)
      const validBusinessUnitRows: FaceFormDatabaseRow[] = [];
      
      values.business_units.forEach((row) => {
        // Only include business units that have a business unit name
        if (row.business_unit_name?.trim()) {
          validBusinessUnitRows.push({
            company_id: companyInfo.id,
            employee_id: userInfo.id,
            function_name: row.business_unit_name.trim(),
            accountable_employee_id: row.head_employee_id || null,
            kpi_list: row.kpi_list?.trim() || '',
            outcome_list: row.outcome_list?.trim() || '',
            is_business_unit: true,
          });
        }
      });

      // Combine all valid rows
      const allRows = [...validFunctionRows, ...validBusinessUnitRows];
      
      // Check that we have at least one valid entry (function with person OR business unit)
      if (validFunctionRows.length === 0 && validBusinessUnitRows.length === 0) {
        setSubmitStatus('Please fill in at least one function with a person accountable or one business unit.');
        setLoading(false);
        return;
      }
      
      console.log('Debug - Form submission data:');
      console.log('hasAtLeastOnePersonAccountable:', hasAtLeastOnePersonAccountable);
      console.log('validFunctionRows:', validFunctionRows);
      console.log('validBusinessUnitRows:', validBusinessUnitRows);
      console.log('allRows:', allRows);
      
      // Check for duplicates within the current submission (prevent duplicate entries in the same form)
      const submissionDuplicates = [];
      for (let i = 0; i < allRows.length; i++) {
        for (let j = i + 1; j < allRows.length; j++) {
          if (allRows[i].function_name === allRows[j].function_name &&
              allRows[i].accountable_employee_id === allRows[j].accountable_employee_id &&
              allRows[i].kpi_list === allRows[j].kpi_list &&
              allRows[i].outcome_list === allRows[j].outcome_list) {
            submissionDuplicates.push(allRows[i].function_name);
          }
        }
      }
      
      if (submissionDuplicates.length > 0) {
        const duplicateNames = Array.from(new Set(submissionDuplicates)).join(', ');
        setSubmitStatus(`The entry already captured in database: ${duplicateNames}`);
        setLoading(false);
        return;
      }
      
      // Combine all valid rows - no business unit table needed
      const finalRows = [...validFunctionRows, ...validBusinessUnitRows];
      
      console.log('Final simplified data:', finalRows);
      
      // Delete existing face form records for this company
      const { error: deleteError } = await supabase
        .from('face_form')
        .delete()
        .eq('company_id', companyInfo.id);
      
      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
        throw new Error(`Failed to update existing records: ${deleteError.message}`);
      }
      
      // Insert new face form data
      const { data, error } = await supabase
        .from('face_form')
        .insert(finalRows)
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Database insert failed: ${error.message}`);
      }
      
      console.log('Successfully inserted data:', data);
      
      setSubmitStatus('Form submitted successfully!');
      setSubmittedData(data || finalRows);
      setHasSubmittedData(true);
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      
      // Update original form data
      setOriginalFormData(watchedValues);
      
      // Reload existing data to reflect changes
      await loadExistingData();
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
  
  // Handle delete record (currently unused but kept for future functionality)
  // const handleDeleteRecord = async (functionName: string) => {
  //   if (!companyInfo?.id) return;
  //   
  //   setLoading(true);
  //   try {
  //     const { error } = await supabase
  //       .from('face_form')
  //       .delete()
  //       .eq('company_id', companyInfo.id)
  //       .eq('function_name', functionName);
  //     
  //     if (error) {
  //       throw new Error(`Failed to delete record: ${error.message}`);
  //     }
  //     
  //     setSubmitStatus(`Record for ${functionName} deleted successfully!`);
  //     
  //     // Reload existing data to reflect changes
  //     await loadExistingData();
  //   } catch (err: unknown) {
  //     console.error('Delete error:', err);
  //     const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  //     setSubmitStatus('Delete failed: ' + errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Render read-only view for submitted data
  const renderReadOnlyView = () => {
    if (!hasSubmittedData || submittedData.length === 0) return null;
    
    const functions = submittedData.filter(row => !row.is_business_unit);
    const businessUnits = submittedData.filter(row => row.is_business_unit);
    
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
          const kpiBullets = row.kpi_list ? row.kpi_list.split('\n').filter(line => line.trim()).map(line => line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`) : [];
          const outcomeBullets = row.outcome_list ? row.outcome_list.split('\n').filter(line => line.trim()).map(line => line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`) : [];
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
                  {kpiBullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex}>{bullet}</div>
                  ))}
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {outcomeBullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex}>{bullet}</div>
                  ))}
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
          const kpiBullets = row.kpi_list ? row.kpi_list.split('\n').filter(line => line.trim()).map(line => line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`) : [];
          const outcomeBullets = row.outcome_list ? row.outcome_list.split('\n').filter(line => line.trim()).map(line => line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`) : [];
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
                  {kpiBullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex}>{bullet}</div>
                  ))}
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {outcomeBullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex}>{bullet}</div>
                  ))}
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

          {/* Add Function Button - below all function entries */}
          <div className="p-2 bg-gray-50 border-b border-gray-300">
            {fields.length < MAX_ROWS && (
              <button
                type="button"
                onClick={handleAddRow}
                className="bg-orange-400 text-white px-3 py-1 rounded text-sm hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                + Add Function
              </button>
            )}
          </div>

          {/* Heads of Business Units Header */}
          <div className="grid grid-cols-4 border-b border-gray-300 bg-gray-200">
            <div className="p-3 border-r border-gray-300 relative">
              <div className="font-semibold text-sm text-center">
                Heads of Business Units
              </div>
              {businessUnitFields.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveAllBusinessUnits}
                  className="absolute top-1 right-1 text-red-500 text-xs hover:text-red-700"
                  title="Remove all business units"
                >
                  ✕
                </button>
              )}
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

          {/* Add Business Units Button - moved below header */}
          <div className="p-2 bg-gray-50 border-b border-gray-300">
            {businessUnitFields.length < MAX_BU_ROWS && (
              <button
                type="button"
                onClick={handleAddBusinessUnitRow}
                className="bg-blue-400 text-white px-3 py-1 rounded text-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                + Add Business Unit
              </button>
            )}
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

        {/* Add Row Buttons section removed - buttons moved to above headers */}

        {/* Submit Button */}
        <div className="p-4 bg-gray-50 border-l border-r border-gray-300">
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading || (!hasUnsavedChanges && hasSubmittedData)}
              className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {loading ? 'Submitting...' : hasSubmittedData ? 'Submit Changes' : 'Submit Form'}
            </button>
            {!hasUnsavedChanges && hasSubmittedData && (
              <span className="text-sm text-gray-600">No changes to submit</span>
            )}
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600">You have unsaved changes</span>
            )}
          </div>
          {submitStatus && (
            <div className={`mt-3 text-sm ${submitStatus.startsWith('Form') || submitStatus.includes('deleted') ? 'text-green-600' : 'text-red-600'}`}>
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
          <span className="text-sm font-medium">Identify: 1. More than 1 Person in a Seat; 2. Person in more than 1 seat; 3. Empty seats; 4. Enthusiastically Rehire?</span>
        </div>
      </div>
    </div>
  );
};

export default FaceForm;