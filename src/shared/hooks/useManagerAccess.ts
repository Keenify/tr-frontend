import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { directoryService } from '../services/directoryService';

export const useManagerAccess = () => {
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkManagerAccess = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsManager(false);
          return;
        }

        // Get user's company ID from metadata or profile
        const { data: profile } = await supabase.auth.getUser();
        const companyId = profile.user?.user_metadata?.company_id;

        if (!companyId) {
          setIsManager(false);
          return;
        }

        // Fetch employee data to check role
        const employees = await directoryService.fetchEmployees(companyId);
        const currentEmployee = employees.find(emp => emp.email === user.email);

        if (currentEmployee) {
          const hasManagerRole = currentEmployee.role.toLowerCase().includes('manager');
          setIsManager(hasManagerRole);
        } else {
          setIsManager(false);
        }
      } catch (err) {
        console.error('Error checking manager access:', err);
        setError(err instanceof Error ? err.message : 'Failed to check manager access');
        setIsManager(false);
      } finally {
        setLoading(false);
      }
    };

    checkManagerAccess();
  }, []);

  return { isManager, loading, error };
};
