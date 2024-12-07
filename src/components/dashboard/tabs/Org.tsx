import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { OrgChart } from '../org/OrgChart';
import { useOrgData } from '../../../hooks/useOrgData';

export function Org() {
  const { orgData } = useOrgData();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="divide-y divide-gray-200 h-full">
      {/* Actions Bar */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 overflow-x-auto flex-grow">
        <div className="w-full max-w-full mx-auto pb-16">
          <OrgChart data={orgData} searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  );
}