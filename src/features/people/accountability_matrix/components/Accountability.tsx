import React, { useState } from 'react';
import { Session } from "@supabase/supabase-js";
import { Tab } from '@headlessui/react';
import AccountabilityMatrix from './AccountabilityMatrix';
import QuarterlyKPI from './QuarterlyKPI';
import { useUserAndCompanyData } from "../../../../shared/hooks/useUserAndCompanyData";

interface AccountabilityProps {
  session: Session;
}

const Accountability: React.FC<AccountabilityProps> = ({ session }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { companyInfo } = useUserAndCompanyData(session.user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accountability & Performance</h1>
        {companyInfo?.name && (
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {companyInfo.name}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-700'
                }`
              }
            >
              Accountability Matrix
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-700'
                }`
              }
            >
              Quarterly KPIs
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="flex-1">
            <Tab.Panel className="h-full rounded-xl p-3">
              <AccountabilityMatrix session={session} />
            </Tab.Panel>
            <Tab.Panel className="h-full rounded-xl p-3">
              <QuarterlyKPI session={session} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Accountability; 