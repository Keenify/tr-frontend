import React, { useState, useEffect, useCallback } from 'react';
import { strataService } from './services/Strata';
import { SevenStrata, Company, STRATA_SECTIONS, StrataProps } from './types';
import { useUserAndCompanyData } from '../../shared/hooks/useUserAndCompanyData';
import toast from 'react-hot-toast';
// Simple debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Editable Components
const EditableCell: React.FC<{
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}> = ({ value, onSave, placeholder, multiline = false, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (!disabled) {
      onSave(editValue);
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  if (isEditing && !disabled) {
    return multiline ? (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    ) : (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`w-full p-2 min-h-[40px] border-2 border-transparent rounded transition-colors ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'cursor-text hover:bg-gray-50 hover:border-gray-200'
      }`}
    >
      {value || (
        <span className="text-gray-400 italic">
          {disabled ? 'Select organization to edit...' : (placeholder || 'Click to edit...')}
        </span>
      )}
    </div>
  );
};

const EditableList: React.FC<{
  items: string[];
  onSave: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  disabled?: boolean;
}> = ({ items, onSave, placeholder, maxItems, disabled = false }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (disabled || (maxItems && items.length >= maxItems)) return;
    const newItems = [...items, ''];
    setEditingIndex(newItems.length - 1);
    setEditValue('');
    onSave(newItems);
  };

  const handleSave = (index: number, value: string) => {
    const newItems = [...items];
    if (value.trim()) {
      newItems[index] = value.trim();
    } else {
      newItems.splice(index, 1);
    }
    onSave(newItems);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onSave(newItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleSave(index, editValue);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {editingIndex === index && !disabled ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSave(index, editValue)}
              onKeyDown={(e) => handleKeyPress(e, index)}
              placeholder={placeholder}
              className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <div
              onClick={() => {
                if (!disabled) {
                  setEditingIndex(index);
                  setEditValue(item);
                }
              }}
              className={`flex-1 p-2 border-2 border-transparent rounded transition-colors ${
                disabled 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'cursor-text hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              {item || (
                <span className="text-gray-400 italic">
                  {disabled ? 'Select organization to edit...' : 'Click to edit...'}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => handleDelete(index)}
            disabled={disabled}
            className={`p-1 rounded ${
              disabled 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            ✕
          </button>
        </div>
      ))}
      {(!maxItems || items.length < maxItems) && (
        <button
          onClick={handleAdd}
          disabled={disabled}
          className={`w-full p-2 border-2 border-dashed rounded transition-colors ${
            disabled
              ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          + Add Item
        </button>
      )}
    </div>
  );
};

const MatrixSection: React.FC<{
  data: any;
  onSave: (data: any) => void;
  disabled?: boolean;
}> = ({ data, onSave, disabled = false }) => {
  const columns = [
    { key: 'core_customers', title: 'Core Customers' },
    { key: 'products_services', title: 'Products & Services' },
    { key: 'brand_promises', title: 'Brand Promises' },
    { key: 'kpis', title: 'KPIs' }
  ];

  const handleColumnSave = (columnKey: string, items: string[]) => {
    onSave({
      ...data,
      [columnKey]: items
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.key} className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">
            {column.title}
          </h4>
          <EditableList
            items={data[column.key] || []}
            onSave={(items) => handleColumnSave(column.key, items)}
            placeholder={`Add ${column.title.toLowerCase()}...`}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
};

const DualSection: React.FC<{
  data: any;
  onSave: (data: any) => void;
  disabled?: boolean;
}> = ({ data, onSave, disabled = false }) => {
  const handleSave = (key: string, items: string[]) => {
    onSave({
      ...data,
      [key]: items
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold text-sm text-gray-700 border-b pb-1 mb-2">
          Profit per X
        </h4>
        <EditableList
          items={data.profit_per_x || []}
          onSave={(items) => handleSave('profit_per_x', items)}
          placeholder="Add profit model..."
          disabled={disabled}
        />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-700 border-b pb-1 mb-2">
          BHAG (10-25 year goal)
        </h4>
        <EditableList
          items={data.bhag || []}
          onSave={(items) => handleSave('bhag', items)}
          placeholder="Add long-term goal..."
          disabled={disabled}
        />
      </div>
    </div>
  );
};

const StrataPage: React.FC<StrataProps> = ({ session }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [strataData, setStrataData] = useState<SevenStrata | null>(null);
  const [originalData, setOriginalData] = useState<SevenStrata | null>(null); // Store original data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // Start in edit mode
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sectionDescriptions, setSectionDescriptions] = useState<{[key: string]: boolean}>({});

  const { userInfo, companyInfo } = useUserAndCompanyData(session.user.id);
  
  // Toggle section description visibility
  const toggleSectionDescription = (sectionId: string) => {
    setSectionDescriptions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Always show default form structure
  const defaultFormData = strataService.getDefaultStrataData(session.user.id, selectedCompanyId || 'temp');

  // Load companies when userInfo becomes available (following Rockefeller pattern)
  useEffect(() => {
    if (userInfo?.user_id) {
      loadCompanies();
    }
  }, [userInfo]);

  // Auto-select company if user has only one company
  useEffect(() => {
    if (companies.length === 1 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId && userInfo?.user_id) {
      loadStrataData();
    } else {
      // Always show default form structure even without company selection
      setStrataData(defaultFormData as SevenStrata);
    }
  }, [selectedCompanyId, userInfo]);

  const loadCompanies = async () => {
    // Only load companies if we have userInfo (following Rockefeller pattern)
    if (!userInfo?.user_id) {
      console.log('🔍 Testing: Waiting for userInfo...');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Testing: Starting loadCompanies for userInfo.user_id:', userInfo.user_id);
      
      const companiesData = await strataService.getCompaniesForUser(userInfo.user_id);
      console.log('🔍 Testing: Received companiesData:', companiesData);
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('🔍 Testing: loadCompanies error:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadStrataData = async () => {
    if (!userInfo?.user_id || !selectedCompanyId) {
      console.log('🔍 Testing: Missing userInfo or selectedCompanyId for loadStrataData');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Testing: Loading strata data for user:', userInfo.user_id, 'company:', selectedCompanyId);
      
      const data = await strataService.getStrataByCompany(userInfo.user_id, selectedCompanyId);
      
      if (data) {
        console.log('🔍 Testing: Loaded strata data:', data);
        setStrataData(data);
        setOriginalData(data); // Store original data
        
        // Check if form has any content (not just default empty values)
        const hasContent = checkIfFormHasContent(data);
        setIsEditMode(!hasContent); // If has content, start in view mode
        setHasUnsavedChanges(false);
      } else {
        console.log('🔍 Testing: No strata data found, using default');
        // Should not happen since we pre-populated, but fallback
        const defaultData = strataService.getDefaultStrataData(userInfo.user_id, selectedCompanyId);
        setStrataData(defaultData as SevenStrata);
        setOriginalData(defaultData as SevenStrata);
        setIsEditMode(true); // Start in edit mode for new forms
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('🔍 Testing: Error loading strata data:', error);
      toast.error('Failed to load strata data');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async (updates: Partial<SevenStrata>) => {
      if (!selectedCompanyId || !userInfo?.user_id) return;

      try {
        const result = await strataService.upsertStrata({
          user_id: userInfo.user_id,
          company_id: selectedCompanyId,
          ...strataData,
          ...updates
        });

        if (result) {
          setStrataData(result);
          toast.success('Changes saved automatically', { duration: 2000 });
        }
      } catch (error) {
        toast.error('Failed to save changes');
      }
    }, 1000),
    [selectedCompanyId, userInfo, strataData]
  );

  // Helper function to check if form has meaningful content
  const checkIfFormHasContent = (data: SevenStrata): boolean => {
    return !!(
      data.words_you_own?.length > 0 ||
      data.sandbox_brand_promises?.core_customers?.length > 0 ||
      data.sandbox_brand_promises?.products_services?.length > 0 ||
      data.sandbox_brand_promises?.brand_promises?.length > 0 ||
      data.sandbox_brand_promises?.kpis?.length > 0 ||
      data.brand_promise_guarantee?.trim() ||
      data.one_phrase_strategy?.trim() ||
      data.differentiating_activities?.length > 0 ||
      data.x_factor?.trim() ||
      data.profit_bhag?.profit_per_x?.length > 0 ||
      data.profit_bhag?.bhag?.length > 0
    );
  };

  const handleUpdate = (field: string, value: any) => {
    if (!isEditMode) return; // Don't allow updates in view mode
    
    const updates = { [field]: value };
    setStrataData(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
    // Remove auto-save for now - only save when user clicks Save button
  };

  // Save function
  const handleSave = async () => {
    if (!selectedCompanyId || !userInfo?.user_id || !strataData) return;

    try {
      setSaving(true);
      
      const dataToSave = {
        user_id: userInfo.user_id,
        company_id: selectedCompanyId,
        ...strataData
      };
      
      const result = await strataService.upsertStrata(dataToSave);

      if (result) {
        setStrataData(result);
        setOriginalData(result);
        setHasUnsavedChanges(false);
        setIsEditMode(false); // Switch to view mode after save
        toast.success('Strata data saved successfully');
      } else {
        toast.error('Save operation failed');
      }
    } catch (error) {
      console.error('Error saving strata:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Edit function
  const handleEdit = () => {
    setIsEditMode(true);
  };

  // Cancel function
  const handleCancel = () => {
    if (originalData) {
      setStrataData(originalData);
      setHasUnsavedChanges(false);
      setIsEditMode(false);
    }
  };

  const handleDeleteStrata = async () => {
    if (!selectedCompanyId || !userInfo?.user_id) return;

    try {
      const success = await strataService.deleteStrata(userInfo.user_id, selectedCompanyId);
      if (success) {
        // For single company users, keep company selected and reset form data
        if (companies.length === 1) {
          const defaultData = strataService.getDefaultStrataData(userInfo.user_id, selectedCompanyId);
          setStrataData(defaultData as SevenStrata);
          setOriginalData(defaultData as SevenStrata);
          setIsEditMode(true);
          setHasUnsavedChanges(false);
          // Keep selectedCompanyId so single-company users don't need to reselect
        } else {
          // For multiple company users, reset to selector
          setSelectedCompanyId('');
          setStrataData(null);
          setOriginalData(null);
          setIsEditMode(true);
          setHasUnsavedChanges(false);
        }
        toast.success('Strata data deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete strata data');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isFormDisabled = !selectedCompanyId || !isEditMode;
  const displayData = strataData || defaultFormData;

  if (loading && !displayData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">7 Strata Strategic Planning</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Organization Selector */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-blue-100 mb-2">
                {companies.length === 1 ? 'Organization' : 'Select Organization'}
              </label>
              {companies.length === 1 ? (
                <div className="w-full sm:w-64 p-3 border border-blue-300 rounded-lg bg-white text-gray-900 font-medium">
                  {companies[0].name}
                </div>
              ) : (
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className={`w-full sm:w-64 p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-white ${
                    selectedCompanyId ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  <option value="" disabled hidden>Select an organization...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-b-lg shadow-lg border border-gray-200 border-t-0">

        {/* Notification Banner - Only show if no company selected */}
        {!selectedCompanyId && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Please select an organization from the header</strong> to fill out the 7 Strata form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode Status Banner */}
        {selectedCompanyId && !isEditMode && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>View Mode:</strong> Form is in read-only mode. Click "Edit" to make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strata Sections - Always Show */}
        {displayData && (
          <div className="p-6 space-y-6">
            {STRATA_SECTIONS.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                    <button
                      onClick={() => toggleSectionDescription(section.id)}
                      className="p-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-500"
                      title={sectionDescriptions[section.id] ? "Hide description" : "Show description"}
                    >
                      {sectionDescriptions[section.id] ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {sectionDescriptions[section.id] && (
                    <p className="text-gray-600 text-sm mt-2 animate-in slide-in-from-top-2 duration-200">
                      {section.description}
                    </p>
                  )}
                </div>

              <div className="mt-4">
                {section.type === 'text' && (
                  <EditableCell
                    value={displayData[section.id as keyof SevenStrata] as string || ''}
                    onSave={(value) => handleUpdate(section.id, value)}
                    placeholder={`Enter your ${section.title.toLowerCase()}...`}
                    multiline
                    disabled={isFormDisabled}
                  />
                )}

                {section.type === 'list' && (
                  <EditableList
                    items={displayData[section.id as keyof SevenStrata] as string[] || []}
                    onSave={(items) => handleUpdate(section.id, items)}
                    placeholder={`Add ${section.title.toLowerCase()}...`}
                    maxItems={section.maxItems}
                    disabled={isFormDisabled}
                  />
                )}

                {section.type === 'matrix' && (
                  <MatrixSection
                    data={displayData.sandbox_brand_promises}
                    onSave={(data) => handleUpdate('sandbox_brand_promises', data)}
                    disabled={isFormDisabled}
                  />
                )}

                {section.type === 'dual' && (
                  <DualSection
                    data={displayData.profit_bhag}
                    onSave={(data) => handleUpdate('profit_bhag', data)}
                    disabled={isFormDisabled}
                  />
                )}
              </div>
            </div>
          ))}
          </div>
        )}
        
        {/* Action Buttons - Bottom Section */}
        {selectedCompanyId && (
          <div className="bg-white border-t border-gray-200 p-6 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className={`px-6 py-2 rounded transition-colors ${
                      saving || !hasUnsavedChanges
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {originalData && checkIfFormHasContent(originalData) && (
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white border border-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
              
              {strataData && checkIfFormHasContent(strataData) && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Delete Form
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete 7 Strata Data
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete all 7 Strata data for this organization? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStrata}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrataPage;