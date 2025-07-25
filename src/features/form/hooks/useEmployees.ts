import { useEffect, useState } from 'react';
import { getAllEmployees, UserData } from '../../../services/useUser';
import { Employee } from '../types/paceFormTypes';

// Extend Employee type locally to include is_employee and profile_pic_url
export interface ExtendedEmployee extends Employee {
  is_employee: boolean;
  profile_pic_url: string | null;
}

export function useEmployees(companyId: string) {
  const [employees, setEmployees] = useState<ExtendedEmployee[]>([]);
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
        
        // Transform UserData to ExtendedEmployee format
        const employeeData: ExtendedEmployee[] = userData.map((user: UserData) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          company_id: user.company_id,
          is_employee: user.Is_Employed, // Map to is_employee
          profile_pic_url: user.profile_pic_url || null,
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