import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
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
      console.log('Fetching employees for company:', companyId);
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('company_id', companyId)
        .order('first_name');
      console.log('Employees fetch result:', { data, error });
      if (!error && data) setEmployees(data);
    };
    fetchEmployees();
  }, [companyId]);
  console.log('useEmployees returning employees:', employees);
  return employees;
} 