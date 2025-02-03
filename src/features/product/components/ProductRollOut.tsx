import React from 'react';
import { Session } from '@supabase/supabase-js';

interface ProductRollOutProps {
  session: Session;
}

const ProductRollOut: React.FC<ProductRollOutProps> = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <h1 className="text-2xl font-semibold">Coming Soon</h1>
    </div>
  );
};

export default ProductRollOut; 