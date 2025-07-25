import { useEffect, useState } from 'react';
import { getAllEmployees, UserData } from '../../../services/useUser';
import { Employee } from '../types/paceFormTypes';

export function useEmployees(companyId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    console.log('useEmployees called with companyId:', companyId);
    if (!companyId) {
      console.log('No companyId provided, setting empty employees');
      setEmployees([]);
      return;
    }
    const fetchEmployees = async () => {
      try {
        console.log('Fetching employees for company:', companyId);
        const userData = await getAllEmployees(companyId);
        console.log('Employees fetch result:', userData);
        
        // Transform UserData to Employee format
        const employeeData: Employee[] = userData.map((user: UserData) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          company_id: user.company_id,
          profile_pic_url: user.profile_pic_url
        }));
        
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [companyId]);
  console.log('useEmployees returning employees:', employees);
  return employees;
} 