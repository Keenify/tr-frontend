import { OrgChart } from './OrgChart';
import { Session } from '@supabase/supabase-js';
import { directoryService } from "../../../../shared/services/directoryService";
import { useEffect, useState } from 'react';

/**
 * Props for OrgChartPage component.
 * @param session - The current user session from Supabase.
 */
interface OrgChartPageProps {
  session: Session; 
}

/**
 * OrgChartPage component fetches the company ID for the logged-in user
 * and renders the OrgChart component.
 * 
 * @param session - The current user session.
 * @returns JSX.Element | null - Returns the OrgChart component or null if companyId is not available.
 */
const OrgChartPage = ({ session }: OrgChartPageProps) => {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetches the company ID for the current user session.
     */
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
