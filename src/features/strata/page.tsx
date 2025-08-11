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
  
  // Collaboration state
  const [lastEditedBy, setLastEditedBy] = useState<string | null>(null);
  const [lastEditedAt, setLastEditedAt] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // NEW: Concurrent editing conflict detection
  const [formLoadedAt, setFormLoadedAt] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    currentUserChanges: SevenStrata | null;
    otherUserInfo: string | null;
    otherUserTime: string | null;
  }>({ currentUserChanges: null, otherUserInfo: null, otherUserTime: null });

  const { userInfo, companyInfo } = useUserAndCompanyData(session.user.id);
  
  // Toggle section description visibility
  const toggleSectionDescription = (sectionId: string) => {
    setSectionDescriptions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Always show default form structure (NEW: no user_id needed)
  const defaultFormData = strataService.getDefaultStrataData(selectedCompanyId || 'temp');

  // Load companies when userInfo and companyInfo become available 
  useEffect(() => {
    if (userInfo?.user_id && companyInfo?.id) {
      loadCompanies();
    }
  }, [userInfo, companyInfo]);

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
    // Only load companies if we have userInfo and companyInfo
    if (!userInfo?.user_id || !companyInfo?.id) {
      console.log('🔍 Waiting for userInfo and companyInfo...');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Starting loadCompanies for userInfo.user_id:', userInfo.user_id);
      console.log('🔍 User primary company:', companyInfo.name, 'ID:', companyInfo.id);
      
      // Get companies with existing strata data (for multi-company scenario)
      const serviceCompanies = await strataService.getCompaniesForUser(userInfo.user_id);
      console.log('🔍 Service returned companies with strata data:', serviceCompanies);
      
      // Start with user's primary company
      const userAccessibleCompanies: Company[] = [{
        id: companyInfo.id,
        name: companyInfo.name
      }];
      
      // Add any additional companies from strata data that user might have access to
      // BUT only if they match user's company (for now, keeping it simple)
      const additionalCompanies = serviceCompanies.filter(
        serviceCompany => serviceCompany.id !== companyInfo.id
      );
      
      // For now, we'll only show user's primary company to prevent unauthorized access
      // In the future, you could implement proper multi-company access logic here
      console.log('🔍 User-accessible companies (primary only):', userAccessibleCompanies);
      setCompanies(userAccessibleCompanies);

      // Auto-select the user's company (single company behavior)
      console.log('🔍 Auto-selecting user primary company:', companyInfo.name);
      setSelectedCompanyId(companyInfo.id);
      
    } catch (error) {
      console.error('🔍 loadCompanies error:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadStrataData = async () => {
    if (!userInfo?.user_id || !selectedCompanyId) {
      console.log('🔍 Missing userInfo or selectedCompanyId for loadStrataData');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading strata data for user:', userInfo.user_id, 'company:', selectedCompanyId);
      
      // Record when we start loading for conflict detection
      const loadStartTime = new Date().toISOString();
      
      const data = await strataService.getStrataByCompany(userInfo.user_id, selectedCompanyId);
      
      if (data) {
        console.log('🔍 Company strata loaded:', data);
        setStrataData(data);
        setOriginalData(data);
        
        // Set collaboration metadata
        setLastEditedBy(data.last_edited_by || null);
        setLastEditedAt(data.updated_at || null);
        
        // NEW: Track when form was loaded for conflict detection
        setFormLoadedAt(data.updated_at || loadStartTime);
        
        setAccessError(null);
        
        // Check if form has any content (not just default empty values)
        const hasContent = checkIfFormHasContent(data);
        setIsEditMode(!hasContent); // If has content, start in view mode
        setHasUnsavedChanges(false);
      } else {
        console.log('🔍 No company strata found, using default');
        const defaultData = strataService.getDefaultStrataData(selectedCompanyId);
        setStrataData(defaultData as SevenStrata);
        setOriginalData(defaultData as SevenStrata);
        setLastEditedBy(null);
        setLastEditedAt(null);
        
        // NEW: Track loading time for new forms
        setFormLoadedAt(loadStartTime);
        
        setAccessError(null);
        setIsEditMode(true); // Start in edit mode for new forms
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('🔍 Error loading company strata:', error);
      toast.error('Failed to load strata data');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async (updates: Partial<SevenStrata>) => {
      if (!selectedCompanyId || !userInfo?.user_id) return;

      try {
        const result = await strataService.upsertStrata(userInfo.user_id, {
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

  // Enhanced save function with conflict detection
  const handleSave = async () => {
    if (!selectedCompanyId || !userInfo?.user_id || !strataData) return;

    try {
      setSaving(true);
      
      // NEW: Check for conflicts before saving
      console.log('🔍 Checking for conflicts before save...');
      const currentData = await strataService.getStrataByCompany(userInfo.user_id, selectedCompanyId);
      
      // Conflict detection: check if form was updated by someone else since we loaded it
      if (currentData && formLoadedAt && currentData.updated_at && currentData.updated_at > formLoadedAt) {
        console.log('🔍 Conflict detected!', {
          formLoadedAt,
          currentUpdatedAt: currentData.updated_at,
          lastEditedBy: currentData.last_edited_by
        });

        // Show conflict resolution dialog
        setConflictData({
          currentUserChanges: strataData,
          otherUserInfo: currentData.last_edited_by === userInfo?.user_id ? 'You (from another session)' : 'Another team member',
          otherUserTime: currentData.updated_at
        });
        setShowConflictModal(true);
        setSaving(false);
        return; // Stop save process
      }

      console.log('🔍 No conflicts detected, proceeding with save...');
      
      // Proceed with normal save
      const result = await strataService.upsertStrata(userInfo.user_id, {
        company_id: selectedCompanyId,
        ...strataData
      });

      if (result) {
        setStrataData(result);
        setOriginalData(result);
        
        // Update collaboration metadata
        setLastEditedBy(result.last_edited_by || userInfo.user_id);
        setLastEditedAt(result.updated_at || new Date().toISOString());
        
        // NEW: Update form loaded timestamp after successful save
        setFormLoadedAt(result.updated_at || new Date().toISOString());
        
        setHasUnsavedChanges(false);
        setIsEditMode(false); // Switch to view mode after save
        toast.success('Strategic planning data saved successfully');
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

  // Enhanced edit function with form refresh
  const handleEdit = async () => {
    setIsEditMode(true);
    
    // Refresh form data when entering edit mode to get latest version
    if (selectedCompanyId && userInfo?.user_id) {
      try {
        const latestData = await strataService.getStrataByCompany(userInfo.user_id, selectedCompanyId);
        if (latestData && latestData.updated_at && latestData.updated_at !== lastEditedAt) {
          // Form was updated by someone else, refresh the data
          console.log('🔍 Refreshing form data on edit - newer version available');
          setStrataData(latestData);
          setOriginalData(latestData);
          setLastEditedBy(latestData.last_edited_by || null);
          setLastEditedAt(latestData.updated_at || null);
          setFormLoadedAt(latestData.updated_at || new Date().toISOString());
          setHasUnsavedChanges(false);
          toast.info('Form updated with latest data before editing');
        }
      } catch (error) {
        console.error('🔍 Error refreshing form data on edit:', error);
        // Continue with edit mode even if refresh fails
      }
    }
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
          const defaultData = strataService.getDefaultStrataData(selectedCompanyId);
          setStrataData(defaultData as SevenStrata);
          setOriginalData(defaultData as SevenStrata);
          
          // NEW: Clear collaboration metadata
          setLastEditedBy(null);
          setLastEditedAt(null);
          setIsEditMode(true);
          setHasUnsavedChanges(false);
          // Keep selectedCompanyId so single-company users don't need to reselect
        } else {
          // For multiple company users, reset to selector
          setSelectedCompanyId('');
          setStrataData(null);
          setOriginalData(null);
          
          // NEW: Clear collaboration metadata
          setLastEditedBy(null);
          setLastEditedAt(null);
          
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
            {/* Organization Selector - Enhanced for single/multi-company detection */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-blue-100 mb-2">
                {companies.length === 1 ? 'Organization' : 'Select Organization'}
              </label>
              
              {companies.length === 0 ? (
                <div className="w-full sm:w-64 p-3 border border-blue-300 rounded-lg bg-gray-100 text-gray-500">
                  Loading organizations...
                </div>
              ) : companies.length === 1 ? (
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
                  <option value="" disabled hidden>
                    {companies.length > 5 ? 'Choose from your organizations...' : 'Select an organization...'}
                  </option>
                  {companies.map((company, index) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                      {index === 0 && companyInfo?.id === company.id ? ' (Your Primary)' : ''}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Multi-company indicator */}
              {companies.length > 1 && (
                <div className="text-xs text-blue-200 mt-1">
                  {companies.length} organizations available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-b-lg shadow-lg border border-gray-200 border-t-0">

        {/* Notification Banner - Enhanced for different scenarios */}
        {!selectedCompanyId && companies.length > 1 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Please select an organization from the dropdown above</strong> to view and edit the 7 Strata strategic planning form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading banner for when companies are being fetched */}
        {companies.length === 0 && loading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Loading your organizations...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Banner */}
        {accessError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Access Denied:</strong> {accessError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Collaboration Info Banner */}
        {selectedCompanyId && !accessError && (lastEditedBy || !isEditMode) && (
          <div className={`border-l-4 p-4 m-6 rounded-md ${
            isEditMode ? 'bg-blue-50 border-blue-400' : 'bg-green-50 border-green-400'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {isEditMode ? (
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    {isEditMode ? (
                      <p className={`text-sm mb-1 ${isEditMode ? 'text-blue-700' : 'text-green-700'}`}>
                        <strong>✏️ Editing Mode:</strong> You are currently editing this strategic planning form.
                        {hasUnsavedChanges && <span className="ml-2 text-orange-600 font-medium">• Unsaved changes</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-green-700 mb-1">
                        <strong>👥 Shared Strategic Planning:</strong> This form is shared across your organization.
                      </p>
                    )}
                    
                    {lastEditedBy && lastEditedAt && (
                      <div className={`text-sm ${isEditMode ? 'text-blue-600' : 'text-green-600'}`}>
                        {(() => {
                          const editTime = new Date(lastEditedAt);
                          const now = new Date();
                          const diffMinutes = Math.floor((now.getTime() - editTime.getTime()) / (1000 * 60));
                          const isCurrentUser = lastEditedBy === session.user.id;
                          
                          if (diffMinutes < 1) {
                            return (
                              <p>
                                Last edited: <span className="font-medium">Just now</span>
                                {!isCurrentUser && <span className="ml-1 text-orange-600 font-medium">(by team member)</span>}
                                {diffMinutes === 0 && !isCurrentUser && <span className="ml-2 animate-pulse">🟢 Recently active</span>}
                              </p>
                            );
                          } else if (diffMinutes < 60) {
                            return (
                              <p>
                                Last edited: <span className="font-medium">{diffMinutes} minute{diffMinutes > 1 ? 's' : ''} ago</span>
                                {!isCurrentUser && <span className="ml-1 font-medium">(by team member)</span>}
                                {diffMinutes < 5 && !isCurrentUser && <span className="ml-2 text-orange-500">🟡 Recently active</span>}
                              </p>
                            );
                          } else {
                            return (
                              <p>
                                Last edited: {editTime.toLocaleDateString()} at {editTime.toLocaleTimeString()}
                                {!isCurrentUser && <span className="ml-1 font-medium">(by team member)</span>}
                              </p>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-sm ${isEditMode ? 'text-blue-600' : 'text-green-600'}`}>
                    {isEditMode ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span>Remember to save your changes</span>
                          {hasUnsavedChanges && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Unsaved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={handleSave}
                            disabled={saving || !hasUnsavedChanges}
                            className={`px-4 py-1 text-sm rounded transition-colors ${
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
                              className="px-4 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span>
                        Click "
                        <button
                          onClick={handleEdit}
                          className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer bg-transparent border-none p-0 m-0 inline"
                        >
                          Edit
                        </button>
                        " to make changes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strata Sections - Show if no access error */}
        {displayData && !accessError && (
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
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                Editing Conflict Detected
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                <strong>{conflictData.otherUserInfo}</strong> has updated this strategic planning form 
                while you were editing.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Last updated: {conflictData.otherUserTime ? new Date(conflictData.otherUserTime).toLocaleString() : 'Unknown'}
              </p>
              <p className="text-gray-600">
                Choose how you would like to proceed:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={async () => {
                  // Option 1: Reload latest data (lose current changes)
                  setShowConflictModal(false);
                  await loadStrataData();
                  toast.info('Form reloaded with latest data');
                }}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Reload Latest Version</div>
                <div className="text-sm text-gray-600">Discard your changes and load the latest version</div>
              </button>

              <button
                onClick={async () => {
                  // Option 2: Force save (overwrite other changes)
                  setShowConflictModal(false);
                  if (conflictData.currentUserChanges) {
                    try {
                      setSaving(true);
                      const result = await strataService.upsertStrata(userInfo.user_id, {
                        company_id: selectedCompanyId,
                        ...conflictData.currentUserChanges
                      });
                      
                      if (result) {
                        setStrataData(result);
                        setOriginalData(result);
                        setLastEditedBy(result.last_edited_by || userInfo.user_id);
                        setLastEditedAt(result.updated_at || new Date().toISOString());
                        setFormLoadedAt(result.updated_at || new Date().toISOString());
                        setHasUnsavedChanges(false);
                        setIsEditMode(false);
                        toast.success('Your changes have been saved (overwrote other changes)');
                      }
                    } catch (error) {
                      toast.error('Failed to save changes');
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
                className="w-full p-3 text-left border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <div className="font-medium text-orange-900">Save My Changes Anyway</div>
                <div className="text-sm text-orange-600">Keep your changes and overwrite the other user's changes</div>
              </button>

              <button
                onClick={() => {
                  // Option 3: Cancel and stay in edit mode
                  setShowConflictModal(false);
                }}
                className="w-full p-3 text-left border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-blue-900">Continue Editing</div>
                <div className="text-sm text-blue-600">Keep editing your changes (try saving again later)</div>
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Tip:</strong> To avoid conflicts, coordinate with your team about who is editing the strategic plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Clear Strategic Planning Data
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to clear all strategic planning data for this organization? 
              This will remove the data for <strong>all team members</strong> who have access to this organization.
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