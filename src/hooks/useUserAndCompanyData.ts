import { useState, useEffect } from 'react';
import { getUserData, UserData } from '../services/userService';
import { getCompanyData, CompanyData } from '../services/companyService';

export function useUserAndCompanyData(userId: string) {
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData(userId);
        setUserInfo(userData);
        const companyData = await getCompanyData(userData.company_id);
        setCompanyInfo(companyData);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [userId]);

  return { userInfo, companyInfo, error };
} 