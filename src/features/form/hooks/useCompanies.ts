import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Company } from '../types/paceFormTypes';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (!error && data) setCompanies(data);
    };
    fetchCompanies();
  }, []);
  return companies;
} 