import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ClipLoader } from 'react-spinners';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { CompanyData } from '../../../shared/types/companyType';
import { UserData, getAllEmployees } from '../../../services/useUser';
import { getCompanyData } from '../../../services/useCompany';
import Feedback from './Feedback';

interface AdminProps {
  session: Session;
}

const formatWebsiteUrl = (url: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const Admin: React.FC<AdminProps> = ({ session }) => {
  const { companyInfo, error: userError, isLoading: userLoading } = useUserAndCompanyData(session.user.id);
  const [companies, setCompanies] = React.useState<CompanyData[]>([]);
  const [employees, setEmployees] = React.useState<{ [key: string]: UserData[] }>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('company');
  const [isManager, setIsManager] = React.useState<boolean>(false);

  const fetchCompanyDetails = React.useCallback(async () => {
    if (!companyInfo?.id) return;
    
    setLoading(true);
    try {
      // Fetch main company data
      const mainCompany = await getCompanyData(companyInfo.id);
      setCompanies([mainCompany]);

      // Fetch employees for the company
      const companyEmployees = await getAllEmployees(companyInfo.id);
      
      const currentUser = companyEmployees.find(emp => 
        emp.email?.toLowerCase() === session.user.email?.toLowerCase()
      );
      
      setIsManager(currentUser?.role?.toLowerCase() === 'manager');
      
      setEmployees(prev => ({
        ...prev,
        [companyInfo.id]: companyEmployees
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  }, [companyInfo?.id, session.user.email]);

  React.useEffect(() => {
    if (!companyInfo?.id) {
      setLoading(false);
      return;
    }
    console.log('Company ID:', companyInfo?.id);
    fetchCompanyDetails();
  }, [fetchCompanyDetails, companyInfo?.id]);

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ClipLoader size={50} color={"#007BFF"} />
      </div>
    );
  }

  if (userError || error) {
    return (
      <div className="p-4 text-red-600 text-center bg-red-100 rounded-lg">
        <p className="font-medium">No Company Found</p>
        <p className="text-sm mt-2">No company profile attached to this user - {session.user.email}</p>
      </div>
    );
  }

  if (!companyInfo?.id) {
    return (
      <div className="p-4 text-red-600 text-center bg-red-100 rounded-lg">
        <p className="font-medium">No Company Found</p>
        <p className="text-sm mt-2">No company profile found for user ID: {session.user.id}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('company')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Company
            </button>
            {isManager && (
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback
              </button>
            )}
          </nav>
        </div>
      </div>

      {activeTab === 'company' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {company.logo_url && (
                        <img 
                          src={company.logo_url} 
                          alt={`${company.name} logo`}
                          className="h-8 w-8 mr-3 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employees[company.id]?.length || 0} employees
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.website_url && (
                      <a 
                        href={formatWebsiteUrl(company.website_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {company.website_url}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        isManager ? (
          <Feedback companyId={companyInfo?.id} />
        ) : (
          <div className="p-4 text-red-600 text-center bg-red-100 rounded-lg">
            <p className="font-medium">Access Denied</p>
            <p className="text-sm mt-2">Only managers can access the feedback feature.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Admin;
