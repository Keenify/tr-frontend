import { Session } from "@supabase/supabase-js";
import React, { useState, useEffect, useCallback } from "react";
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";
import Select from 'react-select';
import { 
  createKPI, 
  updateKPI, 
  deleteKPI, 
  getCompanyKPIs,
  createKPITracking,
  deleteKPITracking,
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

// Quarter options
const quarterOptions = [
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' }
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
  
  const [selectedQuarter, setSelectedQuarter] = useState<{ value: string, label: string } | null>({ value: 'Q1', label: 'Q1' });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [trackingNotes, setTrackingNotes] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ value: string, label: string } | null>(null);
  const [isTrackingFormOpen, setIsTrackingFormOpen] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  
  // Add person in charge state for KPI
  const [selectedKPIEmployee, setSelectedKPIEmployee] = useState<{ value: string, label: string } | null>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    kpi_name: '',
    ideal_state: '',
  });

  // Memoize fetchKPIs to prevent unnecessary recreation
  const fetchKPIs = useCallback(async () => {
    if (!companyInfo?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const kpisData = await getCompanyKPIs(companyInfo.id);
      
      // Fetch tracking records for each KPI
      const kpisWithTrackings = await Promise.all(
        kpisData.map(async (kpi) => {
          try {
            const trackingRecords = await getTrackingsByKPI(kpi.id);
            return {
              ...kpi,
              tracking_records: trackingRecords
            };
          } catch (err) {
            console.error(`Error fetching tracking records for KPI ${kpi.id}:`, err);
            return kpi; // Return KPI without tracking records in case of error
          }
        })
      );
      
      console.log('KPIs with tracking records:', kpisWithTrackings);
      setKpis(kpisWithTrackings);
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
        
        // Find existing KPI to preserve its tracking records
        const existingKPI = kpis.find(kpi => kpi.id === editingId);
        
        // Log for debugging
        console.log('Updating KPI - preserving tracking records:', existingKPI?.tracking_records);
        
        // Update KPI but maintain existing tracking records
        setKpis(kpis.map(kpi => {
          if (kpi.id === editingId) {
            return {
              ...updatedKPI,
              tracking_records: existingKPI?.tracking_records || []
            };
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
        
        // Ensure new KPI has empty tracking_records to avoid loading indicator
        const newKPIWithEmptyTracking = {
          ...newKPI,
          tracking_records: []
        };
        
        setKpis([...kpis, newKPIWithEmptyTracking]);
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

  // Function to open tracking form for a specific KPI
  const handleOpenTrackingForm = (kpiId: string, trackingRecord?: KPITrackingRecord) => {
    setIsTrackingFormOpen(kpiId);
    
    if (trackingRecord) {
      // Edit existing tracking record
      setTrackingNotes(trackingRecord.notes || '');
      setEditingTrackingId(trackingRecord.id);
      
      // Set quarter and year from the existing record
      const quarterOption = quarterOptions.find(q => q.value === trackingRecord.quarter);
      if (quarterOption) {
        setSelectedQuarter(quarterOption);
      }
      
      setSelectedYear(trackingRecord.year);
      
      if (trackingRecord.employee_id) {
        const employee = employees.find(emp => emp.id === trackingRecord.employee_id);
        if (employee) {
          setSelectedEmployee({
            value: employee.id,
            label: `${employee.first_name} ${employee.last_name}`
          });
        }
      } else {
        setSelectedEmployee(null);
      }
    } else {
      // New tracking record
      setTrackingNotes('');
      setSelectedEmployee(null);
      setEditingTrackingId(null);
    }
  };

  // Function to close tracking form
  const handleCloseTrackingForm = () => {
    setIsTrackingFormOpen(null);
    setTrackingNotes('');
    setSelectedEmployee(null);
    setEditingTrackingId(null);
  };

  // Function to create or update a KPI tracking record
  const handleSaveTracking = async (kpiId: string) => {
    if (!selectedQuarter && !editingTrackingId) {
      toast.error('Please select a quarter');
      return;
    }

    if (!trackingNotes.trim()) {
      toast.error('Please enter notes');
      return;
    }

    try {
      if (editingTrackingId) {
        // Update existing tracking record - only notes and employee_id can be changed
        const payload = {
          notes: trackingNotes,
          ...(selectedEmployee && { employee_id: selectedEmployee.value })
        };

        console.log('Updating KPI tracking with payload:', payload);
        
        const updatedTracking = await updateKPITracking(editingTrackingId, payload);
        
        console.log('Tracking record updated:', updatedTracking);
        toast.success('Tracking record updated successfully');
      } else {
        // Create new tracking record - quarter, year, notes, employee_id all required
        if (!selectedQuarter) {
          toast.error('Please select a quarter');
          return;
        }
        
        const payload = {
          kpi_id: kpiId,
          quarter: selectedQuarter.value,
          year: selectedYear,
          notes: trackingNotes,
          status: 'In Progress',
          ...(selectedEmployee && { employee_id: selectedEmployee.value })
        };

        console.log('Creating KPI tracking with payload:', payload);
        
        const newTracking = await createKPITracking(payload);
        
        console.log('New tracking record created:', newTracking);
        toast.success('Tracking record created successfully');
      }
      
      // Reset form
      setTrackingNotes('');
      setSelectedEmployee(null);
      setIsTrackingFormOpen(null);
      setEditingTrackingId(null);
      
      // Refresh KPI data to get the updated tracking records
      await fetchKPIs();
      
    } catch (err) {
      console.error("Error saving KPI tracking:", err);
      setError("Failed to save tracking record. Please try again.");
      toast.error('Failed to save tracking record');
    }
  };

  // Function to delete a KPI tracking record
  const handleDeleteTracking = async (trackingId: string) => {
    if (confirm('Are you sure you want to delete this tracking record?')) {
      try {
        await deleteKPITracking(trackingId);
        toast.success('Tracking record deleted successfully');
        // Refresh KPI data to get the updated tracking records
        await fetchKPIs();
      } catch (err) {
        console.error("Error deleting tracking record:", err);
        toast.error('Failed to delete tracking record');
      }
    }
  };

  // Get current year and year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
    .map(year => ({ value: year, label: year.toString() }));

  // Convert employees to options for the dropdown
  const employeeOptions = employees.map(employee => ({
    value: employee.id,
    label: `${employee.first_name} ${employee.last_name}`
  }));

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
              options={employeeOptions}
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

      {/* KPI List - Display person in charge in the KPI header */}
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
        // Grid layout for KPI cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredKpis.map((kpi) => (
            <div 
              key={kpi.id} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* KPI Header with fixed height for consistent layout */}
              <div className="p-5 flex flex-col h-[200px]">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">{kpi.kpi_name}</h3>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEditKPI(kpi)}
                      className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                      title="Edit KPI"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteKPI(kpi.id)}
                      className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
                      title="Delete KPI"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Category and Person in Charge row */}
                <div className="flex flex-wrap items-center mb-3 gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${kpi.category === 'Time' ? 'bg-purple-100 text-purple-800' : 
                     kpi.category === 'Team' ? 'bg-green-100 text-green-800' : 
                     'bg-blue-100 text-blue-800'}`}>
                    {kpi.category}
                  </span>
                  
                  {/* Display person in charge if available - at the same level as category */}
                  {kpi.employee_id && (() => {
                    const employee = employees.find(emp => emp.id === kpi.employee_id);
                    if (employee) {
                      return (
                        <div className="flex items-center">
                          {employee.profile_pic_url ? (
                            <img 
                              src={employee.profile_pic_url} 
                              alt={`${employee.first_name} ${employee.last_name}`}
                              className="h-6 w-6 rounded-full mr-1.5 object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-1.5 text-xs font-medium text-gray-600 border border-gray-300">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* Ideal state description with scrolling for overflow */}
                <div className="text-sm text-gray-600 flex-grow overflow-y-auto">
                  <p className="whitespace-pre-line">{kpi.ideal_state}</p>
                </div>
              </div>

              {/* Fixed-height separator for consistent alignment */}
              <div className="border-t border-gray-100"></div>

              {/* KPI Tracking Records - Fixed height section */}
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Tracking Records</h4>
                  <button
                    onClick={() => handleOpenTrackingForm(kpi.id)}
                    className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded flex items-center text-xs"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3.5 w-3.5 mr-1" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    Add Record
                  </button>
                </div>
                
                {/* Tracking Form - Keep existing implementation */}
                {isTrackingFormOpen === kpi.id && (
                  <div 
                    className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <h5 className="font-medium text-gray-700 mb-3">Add New Tracking Record</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quarter <span className="text-red-500">*</span>
                          {editingTrackingId && <span className="text-xs text-gray-500 ml-1">(not editable)</span>}
                        </label>
                        <Select
                          value={selectedQuarter}
                          onChange={setSelectedQuarter}
                          options={quarterOptions}
                          placeholder="Select Quarter"
                          classNamePrefix="react-select"
                          isDisabled={!!editingTrackingId}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year <span className="text-red-500">*</span>
                          {editingTrackingId && <span className="text-xs text-gray-500 ml-1">(not editable)</span>}
                        </label>
                        <Select
                          value={{ value: selectedYear, label: selectedYear.toString() }}
                          onChange={(option) => setSelectedYear(option ? (option.value as number) : currentYear)}
                          options={yearOptions}
                          placeholder="Select Year"
                          classNamePrefix="react-select"
                          isDisabled={!!editingTrackingId}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes <span className="text-red-500">*</span>
                        {editingTrackingId && <span className="text-xs text-blue-500 ml-1">(editable)</span>}
                      </label>
                      <textarea
                        value={trackingNotes}
                        onChange={(e) => setTrackingNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tracking notes"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Person in Charge (Optional)
                        {editingTrackingId && <span className="text-xs text-blue-500 ml-1">(editable)</span>}
                      </label>
                      <Select
                        value={selectedEmployee}
                        onChange={setSelectedEmployee}
                        options={employeeOptions}
                        placeholder={loadingEmployees ? "Loading people..." : "Select Person in Charge"}
                        classNamePrefix="react-select"
                        isClearable
                        isLoading={loadingEmployees}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCloseTrackingForm}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveTracking(kpi.id)}
                        disabled={
                          (!selectedQuarter && !editingTrackingId) || 
                          !trackingNotes.trim()
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                      >
                        {editingTrackingId ? 'Update' : 'Save'} Tracking
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Records container with min-height for consistent alignment */}
                <div className="min-h-[50px]">
                  {!kpi.tracking_records ? (
                    <div className="flex items-center justify-center h-12">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  ) : kpi.tracking_records.length > 0 ? (
                    // Use a more compact list view instead of a table for better space utilization
                    <div className="space-y-2">
                      {kpi.tracking_records.map((record: KPITrackingRecord) => (
                        <div 
                          key={record.id} 
                          className="text-xs bg-gray-50 rounded border border-gray-200 overflow-hidden"
                        >
                          <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-100">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{record.quarter} {record.year}</span>
                              {record.employee_id && 
                                (() => {
                                  const employee = employees.find(emp => emp.id === record.employee_id);
                                  if (employee) {
                                    return (
                                      <div className="flex items-center">
                                        <span className="mx-1 text-gray-400">•</span>
                                        <div className="flex items-center">
                                          {employee.profile_pic_url ? (
                                            <img 
                                              src={employee.profile_pic_url} 
                                              alt={`${employee.first_name} ${employee.last_name}`}
                                              className="h-5 w-5 rounded-full mr-1.5 object-cover"
                                            />
                                          ) : (
                                            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center mr-1.5 text-xs font-medium text-gray-600">
                                              {employee.first_name[0]}{employee.last_name[0]}
                                            </div>
                                          )}
                                          <span className="truncate max-w-[100px] text-xs text-gray-700">
                                            {employee.first_name} {employee.last_name}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()
                              }
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleOpenTrackingForm(kpi.id, record)}
                                className="text-blue-600 hover:text-blue-900 p-0.5 rounded hover:bg-blue-50"
                                title="Edit Tracking Record"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTracking(record.id)}
                                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50"
                                title="Delete Tracking Record"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="whitespace-pre-line" title={record.notes || 'No notes'}>
                              {record.notes || 'No notes'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <p className="text-sm text-gray-500 italic">No tracking records yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuarterlyKPI; 