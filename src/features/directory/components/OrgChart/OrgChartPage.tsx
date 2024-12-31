import { useEffect, useState } from 'react';
import { OrgChart } from './OrgChart';
import { directoryService } from "../../services/directoryService"
import { Session } from '@supabase/supabase-js';

interface OrgChartPageProps {
  session: Session; 
}

const OrgChartPage = ({ session }: OrgChartPageProps) => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const getCompanyId = async () => {
      if (session) {
        try {
          const employeeData = await directoryService.fetchEmployee(session.user.id);
          setCompanyId(employeeData.company_id);
        } catch (error) {
          console.error('Failed to fetch company ID:', error);
        }
      }
    };

    getCompanyId();
  }, [session]);

  if (!companyId) return null;

  return <OrgChart companyId={companyId} />;
};

export default OrgChartPage;
