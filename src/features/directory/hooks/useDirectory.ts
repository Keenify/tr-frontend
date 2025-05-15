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

    try {
      setIsLoading(true);
      setError(null);
      const data = await directoryService.fetchEmployees(companyId);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

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
    fetchEmployees
  };
};