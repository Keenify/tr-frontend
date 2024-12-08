import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { OrganizationGraph } from '@ant-design/graphs';
import { useOrgData } from '../../../hooks/useOrgData';

/**
 * Org component that displays an organizational chart and provides search functionality.
 * 
 * This component fetches organizational data using the `useOrgData` hook and displays it
 * in an interactive graph format using the `OrganizationGraph` component. It also includes
 * a search bar to filter members and a button to add new members.
 */
export function Org() {
  const { orgData } = useOrgData();
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Type definition for an organizational member.
   * 
   * @typedef {Object} OrgMember
   * @property {string} id - Unique identifier for the member.
   * @property {string} name - Name of the member.
   * @property {string} role - Role of the member within the organization.
   * @property {string} [department] - Optional department of the member.
   * @property {OrgMember[]} [children] - Optional list of child members.
   */
  type OrgMember = {
    id: string;
    name: string;
    role: string;
    department?: string;
    children?: OrgMember[];
  };

  /**
   * Converts organizational data to the format expected by the OrganizationGraph component.
   * 
   * @param {OrgMember} node - The organizational member to convert.
   * @returns {Object} The converted data suitable for the OrganizationGraph.
   */
  const convertToGraphData = (node: OrgMember): { id: string; value: { name: string; title: string; items: { text: string }[] }; children: any[] } => ({
    id: node.id,
    value: {
      name: node.name,
      title: `${node.role} - ${node.department || 'N/A'}`,
      items: [
        { text: `Role: ${node.role}` },
        { text: `Department: ${node.department || 'N/A'}` },
      ],
    },
    children: node.children ? node.children.map(convertToGraphData) : [],
  });

  const graphData = convertToGraphData(orgData);

  return (
    <div className="divide-y divide-gray-200 h-full flex flex-col">
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
      <div className="flex-grow overflow-auto">
        <OrganizationGraph 
          data={graphData} 
          style={{ width: '100%', height: '100%' }} 
          nodeCfg={{
            size: [250, 150], // Increase node size
            labelCfg: {
              style: {
                fontSize: 12,
                wordWrap: 'break-word', // Ensure text wraps
                whiteSpace: 'normal', // Allow text to wrap
              },
            },
          }}
        />
      </div>
    </div>
  );
}