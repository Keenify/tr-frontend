import { Directory } from '../components/Directory';
import { useEffect, useState } from 'react';
import { directoryService } from '../services/directoryService';
import { Session } from '@supabase/supabase-js';

interface DirectoryPageProps {
  session: Session;
}

const DirectoryPage = ({ session }: DirectoryPageProps) => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (session?.user?.id) {
        try {
          const employeeData = await directoryService.fetchEmployee(session.user.id);
          setCompanyId(employeeData.company_id);
        } catch (error) {
          console.error('Failed to fetch company ID:', error);
        }
      }
    };

    fetchCompanyId();
  }, [session?.user?.id]);
  
  return companyId ? <Directory companyId={companyId} /> : null;
};

export default DirectoryPage;