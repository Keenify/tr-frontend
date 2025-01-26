import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { ClipLoader } from 'react-spinners';

interface ProductProps {
  session: Session;
}

const Product: React.FC<ProductProps> = ({ session }) => {
  const { userInfo, companyInfo, error, isLoading } = useUserAndCompanyData(session.user.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading data: {error.message}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Product Page</h1>
      {companyInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Company Information:</h2>
          <p className="text-gray-600">Company Name: {companyInfo.name}</p>
          {/* Add more company info as needed */}
        </div>
      )}
    </div>
  );
};

export default Product;
