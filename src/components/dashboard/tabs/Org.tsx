import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { OrganizationGraph } from '@ant-design/graphs';
import { useOrgData } from '../../../hooks/useOrgData';

export function Org() {
  const { orgData } = useOrgData();
  const [searchTerm, setSearchTerm] = useState('');

  // Define the OrgMember type to fix the error
  type OrgMember = {
    id: string;
    name: string;
    role: string;
    department?: string;
    children?: OrgMember[];
  };

  // Convert your data to the format expected by OrganizationGraph
  const convertToGraphData = (node: OrgMember): { id: string; value: { title: string; items: { text: string }[] }; children: any[] } => ({
    id: node.id,
    value: {
      title: node.name,
      items: [
        { text: node.role },
        { text: node.department || '' },
      ],
    },
    children: node.children ? node.children.map(convertToGraphData) : [],
  });

  const graphData = {
    id: 'root',
    value: {
      title: orgData.name,
      items: [
        { text: orgData.role },
        { text: orgData.department || '' },
      ],
    },
    children: [convertToGraphData(orgData)],
  };

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
          <OrganizationGraph data={graphData} />
        </div>
      </div>
    </div>
  );
}