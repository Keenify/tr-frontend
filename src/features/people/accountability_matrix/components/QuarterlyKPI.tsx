import { Session } from "@supabase/supabase-js";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import Select from 'react-select';
import { 
  createKPI, 
  updateKPI, 
  deleteKPI, 
  getCompanyKPIs,
  createKPITracking,
  getTrackingsByKPI,
  updateKPITracking
} from "../services/useQuarterlyKPI";
import { KPIData, KPITrackingRecord } from "../types/quarterlyKPI.types";
import { directoryService } from "../../../../shared/services/directoryService";
import { Employee } from "../../../../shared/types/directory.types";
import toast from "react-hot-toast";

interface QuarterlyKPIProps {
  session: Session;
}

// Category options
const categoryOptions = [
  { value: 'Time', label: 'Time' },
  { value: 'Team', label: 'Team' },
  { value: 'Money', label: 'Money' }
];

const QuarterlyKPI: React.FC<QuarterlyKPIProps> = ({ session }) => {
  const { companyInfo, isLoading: isLoadingCompany } = useUserAndCompanyData(session.user.id);
  
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [filteredKpis, setFilteredKpis] = useState<KPIData[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Replace single category selection with multiple categories
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Time', 'Team', 'Money']));
  
  // Add search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Add person in charge state for KPI
  const [selectedKPIEmployee, setSelectedKPIEmployee] = useState<{ value: string, label: string } | null>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    kpi_name: '',
    ideal_state: '',
  });

  // Add current year state to use for tracking
  const [currentYear] = useState<number>(new Date().getFullYear());
  
  // Determine the current quarter as a constant
  const currentQuarter = (() => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  })();
  
  // Calculate progress through current quarter
  const quarterProgress = (() => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Determine which quarter month we're in (0-2)
    const quarterMonth = month % 3;
    
    // Approximate days in the quarter (90-92 days)
    const daysInQuarter = 90;
    
    // Approximate day of quarter
    const dayOfQuarter = (quarterMonth * 30) + day;
    
    // Calculate percentage (0-100)
    return Math.min(Math.round((dayOfQuarter / daysInQuarter) * 100), 100);
  })();
  
  // Add state to store KPI tracking records
  const [trackingRecords, setTrackingRecords] = useState<Record<string, KPITrackingRecord[]>>({});

  // Add state for the note modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeKpiId, setActiveKpiId] = useState<string | null>(null);
  const [activeQuarter, setActiveQuarter] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Memoize fetchKPIs to prevent unnecessary recreation
  const fetchKPIs = useCallback(async () => {
    if (!companyInfo?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const kpisData = await getCompanyKPIs(companyInfo.id);
      setKpis(kpisData);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
      setError("Failed to load KPIs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [companyInfo?.id]);

  // Get KPIs when company info is loaded
  useEffect(() => {
    if (companyInfo?.id) {
      fetchKPIs();
    }
  }, [companyInfo, fetchKPIs]);

  // Update the filter effect to use the set of selected categories and search query
  useEffect(() => {
    let filtered = [...kpis];
    
    // When no categories are selected, show no KPIs
    if (selectedCategories.size === 0) {
      setFilteredKpis([]);
      return;
    }
    
    // Only filter if not all categories are selected
    if (selectedCategories.size !== categoryOptions.length) {
      filtered = filtered.filter(kpi => selectedCategories.has(kpi.category));
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kpi => 
        kpi.kpi_name.toLowerCase().includes(query) || 
        kpi.ideal_state.toLowerCase().includes(query)
      );
    }
    
    // Sort KPIs by category in the order of Time, Team, Money
    filtered.sort((a, b) => {
      const categoryOrder = { Time: 1, Team: 2, Money: 3 };
      return (categoryOrder[a.category as keyof typeof categoryOrder] || 99) - 
             (categoryOrder[b.category as keyof typeof categoryOrder] || 99);
    });
    
    setFilteredKpis(filtered);
  }, [kpis, selectedCategories, searchQuery]);

  // Fetch employees when company info is loaded
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyInfo?.id) return;
      
      try {
        setLoadingEmployees(true);
        const employeesData = await directoryService.fetchEmployees(companyInfo.id);
        setEmployees(employeesData);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    
    fetchEmployees();
  }, [companyInfo?.id]);

  // Fetch KPI tracking records for each KPI
  useEffect(() => {
    const fetchTrackingRecords = async () => {
      if (kpis.length === 0) return;
      
      const records: Record<string, KPITrackingRecord[]> = {};
      
      for (const kpi of kpis) {
        try {
          const trackings = await getTrackingsByKPI(kpi.id);
          
          // Normalize quarters to ensure they all have "Q" prefix for consistency
          const normalizedTrackings = trackings.map(tracking => ({
            ...tracking,
            quarter: tracking.quarter.startsWith('Q') ? tracking.quarter : `Q${tracking.quarter}`
          }));
          
          records[kpi.id] = normalizedTrackings;
        } catch (err) {
          console.error(`Error fetching tracking records for KPI ${kpi.id}:`, err);
        }
      }
      
      setTrackingRecords(records);
    };
    
    fetchTrackingRecords();
  }, [kpis]);

  const handleAddKPI = () => {
    setIsFormOpen(true);
    setEditingId(null);
    setFormData({
      category: '',
      kpi_name: '',
      ideal_state: '',
    });
    setSelectedKPIEmployee(null); // Reset selected employee
  };

  const handleEditKPI = (kpi: KPIData) => {
    setIsFormOpen(true);
    setEditingId(kpi.id);
    setFormData({
      category: kpi.category,
      kpi_name: kpi.kpi_name,
      ideal_state: kpi.ideal_state,
    });
    
    // Set selected employee if KPI has one
    if (kpi.employee_id) {
      const employee = employees.find(emp => emp.id === kpi.employee_id);
      if (employee) {
        setSelectedKPIEmployee({
          value: employee.id,
          label: `${employee.first_name} ${employee.last_name}`
        });
      } else {
        setSelectedKPIEmployee(null);
      }
    } else {
      setSelectedKPIEmployee(null);
    }
  };

  const handleDeleteKPI = async (id: string) => {
    if (confirm('Are you sure you want to delete this KPI?')) {
      try {
        await deleteKPI(id);
        setKpis(kpis.filter(kpi => kpi.id !== id));
        toast.success('KPI deleted successfully');
      } catch (err) {
        console.error("Error deleting KPI:", err);
        setError("Failed to delete KPI. Please try again.");
        toast.error('Failed to delete KPI');
      }
    }
  };

  const handleSaveKPI = async () => {
    if (!formData.category || !formData.kpi_name || !formData.ideal_state) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!companyInfo?.id) {
      toast.error('Company information is not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing KPI
        const updatedKPI = await updateKPI(editingId, {
          category: formData.category,
          kpi_name: formData.kpi_name,
          ideal_state: formData.ideal_state,
          employee_id: selectedKPIEmployee?.value // Include person in charge
        });
        
        setKpis(kpis.map(kpi => {
          if (kpi.id === editingId) {
            return updatedKPI;
          }
          return kpi;
        }));
        
        toast.success('KPI updated successfully');
      } else {
        // Add new KPI
        const newKPI = await createKPI({
          category: formData.category,
          kpi_name: formData.kpi_name,
          ideal_state: formData.ideal_state,
          company_id: companyInfo.id,
          employee_id: selectedKPIEmployee?.value // Include person in charge
        });
        
        setKpis([...kpis, newKPI]);
        toast.success('KPI created successfully');
      }
      
      setIsFormOpen(false);
      setEditingId(null);
      setSelectedKPIEmployee(null); // Reset selected employee
    } catch (err) {
      console.error("Error saving KPI:", err);
      setError("Failed to save KPI. Please try again.");
      toast.error('Failed to save KPI');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to toggle a category selection
  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  // Helper function to render a category badge
  const renderCategoryBadge = (category: string) => {
    const colorClass = 
      category === 'Time' ? 'bg-purple-100 text-purple-800' : 
      category === 'Team' ? 'bg-green-100 text-green-800' : 
      'bg-blue-100 text-blue-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {category}
      </span>
    );
  };

  // Helper function to get tracking record for a specific quarter
  const getTrackingForQuarter = (kpiId: string, quarter: string) => {
    if (!trackingRecords[kpiId]) return null;
    
    // Quarter should already be normalized during fetch
    return trackingRecords[kpiId].find(record => record.quarter === quarter && record.year === currentYear);
  };
  
  // Helper function to update tracking note
  const updateTrackingNote = async (kpiId: string, quarter: string, notes: string) => {
    try {
      const existingRecord = getTrackingForQuarter(kpiId, quarter);
      
      if (existingRecord) {
        // Update existing tracking record - don't include status in payload
        const updated = await updateKPITracking(existingRecord.id, { 
          quarter, 
          year: currentYear,
          notes
        });
        
        // Update local state
        setTrackingRecords(prev => ({
          ...prev,
          [kpiId]: prev[kpiId].map(record => 
            record.id === existingRecord.id ? updated : record
          )
        }));
      } else {
        // Create new tracking record - status is required for creation
        const newRecord = await createKPITracking({
          kpi_id: kpiId,
          quarter,
          year: currentYear,
          notes,
          status: 'not_started', // Default status since it's required but not used
          employee_id: undefined
        });
        
        // Update local state
        setTrackingRecords(prev => ({
          ...prev,
          [kpiId]: [...(prev[kpiId] || []), newRecord]
        }));
      }
      
      toast.success(`${quarter} note updated`);
    } catch (err) {
      console.error("Error updating tracking note:", err);
      toast.error("Failed to update note");
    }
  };
  
  // Function to handle opening the note modal
  const handleOpenNoteModal = (kpiId: string, quarter: string) => {
    const tracking = getTrackingForQuarter(kpiId, quarter);
    setActiveKpiId(kpiId);
    setActiveQuarter(quarter);
    setNoteText(tracking?.notes || '');
    setIsNoteModalOpen(true);
    
    // Focus on textarea after modal is opened
    setTimeout(() => {
      if (noteInputRef.current) {
        noteInputRef.current.focus();
      }
    }, 50);
  };
  
  // Function to handle saving the note
  const handleSaveNote = () => {
    if (activeKpiId && activeQuarter) {
      updateTrackingNote(activeKpiId, activeQuarter, noteText);
      setIsNoteModalOpen(false);
      setActiveKpiId(null);
      setActiveQuarter(null);
      setNoteText('');
    }
  };
  
  // Function to handle canceling the note edit
  const handleCancelNote = () => {
    setIsNoteModalOpen(false);
    setActiveKpiId(null);
    setActiveQuarter(null);
    setNoteText('');
  };
  
  // Helper function to render note cell
  const renderNoteCell = (kpiId: string, quarter: string) => {
    const tracking = getTrackingForQuarter(kpiId, quarter);
    const hasNote = tracking?.notes && tracking.notes.trim() !== '';
    const isCurrentQuarter = quarter === currentQuarter;
    
    return (
      <td 
        className={`px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors relative text-center ${isCurrentQuarter ? 'bg-blue-50' : ''}`}
        onClick={() => handleOpenNoteModal(kpiId, quarter)}
      >
        {isCurrentQuarter && (
          <div 
            className="absolute top-0 bottom-0 border-r border-blue-400 opacity-50" 
            style={{ left: `${quarterProgress}%` }}
            title={`${quarterProgress}% through ${quarter}`}
          ></div>
        )}
        <div className="text-sm relative">
          {hasNote ? (
            <div className="whitespace-pre-line text-center" title={tracking.notes}>
              {tracking.notes}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>
    );
  };

  if (isLoadingCompany) {
    return <div className="p-8 text-center">Loading company information...</div>;
  }
  
  return (
    <div className="quarterly-kpi-container p-4 md:p-6 max-w-full mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left text-gray-800">Quarterly KPIs</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filter and Add KPI Row - More compact design */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between gap-4 mb-6 bg-white p-5 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto">
          {/* Search bar */}
          <div className="w-full sm:w-72 relative">
            <label htmlFor="search-kpi" className="sr-only">Search KPIs</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search-kpi"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search KPIs..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(option => (
                <label key={option.value} className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedCategories.has(option.value)}
                    onChange={() => toggleCategory(option.value)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleAddKPI}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm ml-auto"
          disabled={isSubmitting}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1.5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
              clipRule="evenodd" 
            />
          </svg>
          Add KPI
        </button>
      </div>

      {/* KPI Form - Add person in charge */}
      {isFormOpen && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{editingId ? 'Edit KPI' : 'Add New KPI'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KPI Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.kpi_name}
                onChange={(e) => setFormData({...formData, kpi_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="KPI Name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={categoryOptions.find(opt => opt.value === formData.category) || null}
                onChange={(option) => setFormData({...formData, category: option ? option.value : ''})}
                options={categoryOptions}
                placeholder="Select Category"
                classNamePrefix="react-select"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ideal State <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.ideal_state}
              onChange={(e) => setFormData({...formData, ideal_state: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the ideal state for this KPI"
              rows={3}
              required
            />
          </div>
          
          {/* Add Person in Charge dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person in Charge (Optional)
            </label>
            <Select
              value={selectedKPIEmployee}
              onChange={setSelectedKPIEmployee}
              options={employees.map(employee => ({
                value: employee.id,
                label: `${employee.first_name} ${employee.last_name}`
              }))}
              placeholder={loadingEmployees ? "Loading people..." : "Select Person in Charge"}
              classNamePrefix="react-select"
              isClearable
              isLoading={loadingEmployees}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveKPI}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                editingId ? 'Update' : 'Save'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {activeQuarter} Note
            </h3>
            
            <textarea
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your note here..."
              rows={5}
            />
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleCancelNote}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Table - Replace cards with a table layout */}
      {isLoading ? (
        <div className="p-8 text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading KPIs...</p>
        </div>
      ) : filteredKpis.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg shadow-sm">
          <svg 
            className="mx-auto h-16 w-16 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No KPIs found</h3>
          <p className="mt-2 text-base text-gray-500">
            Get started by creating a new KPI.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddKPI}
              className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <svg 
                className="-ml-1 mr-2 h-5 w-5" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              Add KPI
            </button>
          </div>
        </div>
      ) : (
        // Table layout for KPIs
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="w-[10%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KPI Name
                </th>
                <th scope="col" className={`w-[17%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider relative ${currentQuarter === 'Q1' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                  Q1
                  {currentQuarter === 'Q1' && (
                    <div 
                      className="absolute top-0 bottom-0 border-r border-blue-500 opacity-70" 
                      style={{ left: `${quarterProgress}%` }}
                      title={`${quarterProgress}% through Q1`}
                    ></div>
                  )}
                </th>
                <th scope="col" className={`w-[17%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider relative ${currentQuarter === 'Q2' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                  Q2
                  {currentQuarter === 'Q2' && (
                    <div 
                      className="absolute top-0 bottom-0 border-r border-blue-500 opacity-70" 
                      style={{ left: `${quarterProgress}%` }}
                      title={`${quarterProgress}% through Q2`}
                    ></div>
                  )}
                </th>
                <th scope="col" className={`w-[17%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider relative ${currentQuarter === 'Q3' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                  Q3
                  {currentQuarter === 'Q3' && (
                    <div 
                      className="absolute top-0 bottom-0 border-r border-blue-500 opacity-70" 
                      style={{ left: `${quarterProgress}%` }}
                      title={`${quarterProgress}% through Q3`}
                    ></div>
                  )}
                </th>
                <th scope="col" className={`w-[17%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider relative ${currentQuarter === 'Q4' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>
                  Q4
                  {currentQuarter === 'Q4' && (
                    <div 
                      className="absolute top-0 bottom-0 border-r border-blue-500 opacity-70" 
                      style={{ left: `${quarterProgress}%` }}
                      title={`${quarterProgress}% through Q4`}
                    ></div>
                  )}
                </th>
                <th scope="col" className="w-[16%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ideal State
                </th>
                <th scope="col" className="w-[12%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Person in Charge
                </th>
                <th scope="col" className="w-[3%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKpis.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-center">
                    <div>
                      {renderCategoryBadge(kpi.category)}
                      <div className="text-sm font-medium text-gray-900 break-words mt-1 text-center" title={kpi.kpi_name}>
                        {kpi.kpi_name}
                      </div>
                    </div>
                  </td>
                  
                  {/* Q1 note cell */}
                  {renderNoteCell(kpi.id, 'Q1')}
                  
                  {/* Q2 note cell */}
                  {renderNoteCell(kpi.id, 'Q2')}
                  
                  {/* Q3 note cell */}
                  {renderNoteCell(kpi.id, 'Q3')}
                  
                  {/* Q4 note cell */}
                  {renderNoteCell(kpi.id, 'Q4')}
                  
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm text-gray-500 whitespace-pre-line text-center">
                      {kpi.ideal_state}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {kpi.employee_id && (() => {
                      const employee = employees.find(emp => emp.id === kpi.employee_id);
                      if (employee) {
                        return (
                          <div className="flex items-center justify-center flex-nowrap">
                            {employee.profile_pic_url ? (
                              <img 
                                src={employee.profile_pic_url} 
                                alt={`${employee.first_name} ${employee.last_name}`}
                                className="h-6 w-6 flex-shrink-0 rounded-full mr-1 object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center mr-1 text-xs font-medium text-gray-600 border border-gray-300">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </div>
                            )}
                            <span className="text-xs text-gray-900 whitespace-normal">
                              {employee.first_name} {employee.last_name}
                            </span>
                          </div>
                        );
                      }
                      return <span className="text-gray-400">—</span>;
                    })() || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditKPI(kpi)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteKPI(kpi.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuarterlyKPI; 