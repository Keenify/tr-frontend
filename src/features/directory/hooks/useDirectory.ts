import { useState, useEffect, useCallback } from 'react';
import { Employee, DirectoryFilters } from '../../../shared/types/directory.types';
import { directoryService } from '../../../shared/services/directoryService';

export const useDirectory = (companyId: string) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<DirectoryFilters>({
    searchQuery: '',
    sortOrder: 'asc',
    selectedEmployeeId: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    // Skip fetch if company ID is not available
    if (!companyId) {
      console.log("Not fetching employees - company ID is missing");
      setError("Company ID is required to fetch employees");
      setIsLoading(false);
      return;
    }

    console.log(`📊 useDirectory: Fetching employees for company: ${companyId}`);
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await directoryService.fetchEmployees(companyId);
      
      console.log(`📋 useDirectory: Received ${data.length} employees from API`);
      console.log(`🔍 useDirectory: Employee data:`, data.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        Is_Employed: emp.Is_Employed,
        email: emp.email
      })));
      
      setEmployees(data);
      console.log(`✅ useDirectory: Employee state updated`);
    } catch (err) {
      console.error(`❌ useDirectory: Failed to fetch employees:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const deactivateEmployee = useCallback(async (employeeId: string) => {
    console.log(`🎯 useDirectory: Starting deactivation for employee: ${employeeId}`);

    try {
      setError(null);
      console.log(`📞 useDirectory: Calling directoryService.deactivateEmployee`);

      const result = await directoryService.deactivateEmployee(employeeId);
      console.log(`📋 useDirectory: Deactivation result:`, result);

      if (result.success) {
        console.log(`🔄 useDirectory: Deactivation successful, refreshing employee list...`);

        // Refresh the employee list to reflect the changes
        await fetchEmployees();
        console.log(`✅ useDirectory: Employee list refreshed`);

        // Close the panel if the deactivated employee was selected
        // Use functional update to avoid filters dependency
        setFilters(currentFilters => {
          if (currentFilters.selectedEmployeeId === employeeId) {
            console.log(`🚪 useDirectory: Closing panel for deactivated employee`);
            return { ...currentFilters, selectedEmployeeId: null };
          }
          return currentFilters;
        });

        return { success: true, message: result.message };
      } else {
        console.log(`⚠️ useDirectory: Deactivation failed:`, result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate employee';
      console.error(`❌ useDirectory: Deactivation error:`, err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [fetchEmployees]);

  useEffect(() => {
    // Only fetch if we have a company ID
    if (companyId) {
      fetchEmployees();
    }
  }, [fetchEmployees, companyId]);

  const filteredEmployees = employees
    .filter(employee => {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      return fullName.includes(filters.searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`;
      const nameB = `${b.first_name} ${b.last_name}`;
      const comparison = nameA.localeCompare(nameB);
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

  return {
    employees: filteredEmployees,
    isLoading,
    error,
    filters,
    setFilters,
    fetchEmployees,
    deactivateEmployee
  };
};