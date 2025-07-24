import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Employee } from '../types/paceFormTypes';

export function useEmployees(companyId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {
    if (!companyId) {
      setEmployees([]);
      return;
    }
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('company_id', companyId)
        .order('first_name');
      if (!error && data) setEmployees(data);
    };
    fetchEmployees();
  }, [companyId]);
  return employees;
} 