import { useState, useEffect } from 'react';
import { getUserData, UserData } from '../../services/userService';
import { getCompanyData } from '../../services/companyService';
import { CompanyData } from '../types/companyType';

export function useUserAndCompanyData(userId: string) {
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserData(userId);
        setUserInfo(userData);
        const companyData = await getCompanyData(userData.company_id) as CompanyData;
        setCompanyInfo(companyData);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { userInfo, companyInfo, error, isLoading };
} 