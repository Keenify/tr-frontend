import React from "react";
import { Session } from "@supabase/supabase-js";

interface OnlineSalesProps {
  session: Session;
}

const OnlineSales: React.FC<OnlineSalesProps> = ({ session }) => {
  console.log(session);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Online Sales Dashboard
      </h1>
      <p className="text-xl text-gray-600 mb-6">Coming Soon!</p>
      <div className="flex gap-8 items-center">
        <div className="text-lg text-gray-700">
          <p>Integration with:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Shopee</li>
            <li>Lazada</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnlineSales;
