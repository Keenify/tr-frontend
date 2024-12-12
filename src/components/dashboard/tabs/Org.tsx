import { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
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
  const [graphInstance, setGraphInstance] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<OrgMember | null>(null);

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
    email?: string;
    phone?: string;
    startDate?: string;
    manager?: string;
    location?: string;
  };

  /**
   * Converts organizational data to the format expected by the OrganizationGraph component.
   * 
   * @param {OrgMember} node - The organizational member to convert.
   * @returns {Object} The converted data suitable for the OrganizationGraph.
   */
  const convertToGraphData = (node: OrgMember): { 
    id: string; 
    value: { 
      name: string; 
      title: string; 
      items: { text: string }[];
      email?: string;
      phone?: string;
      startDate?: string;
      manager?: string;
      location?: string;
    }; 
    children: any[] 
  } => ({
    id: node.id,
    value: {
      name: node.name,
      title: node.role || 'N/A',
      items: [
        { text: `Role: ${node.role}` },
        { text: `Department: ${node.department || 'N/A'}` },
      ],
      email: node.email,
      phone: node.phone,
      startDate: node.startDate,
      manager: node.manager,
      location: node.location,
    },
    children: node.children ? node.children.map(convertToGraphData) : [],
  });

  const graphData = convertToGraphData(orgData);

  const nodeConfig = {
    size: [120, 50],
    labelCfg: {
      style: {
        fontSize: 12,
      },
    },
    draggable: true,
    collapseExpand: true,
  };

  useEffect(() => {
    if (graphInstance) {
      const nodes = graphInstance.getNodes();
      
      // Reset all nodes to default style first
      nodes.forEach((node: any) => {
        graphInstance.updateItem(node, {
          style: {
            stroke: undefined,
            lineWidth: undefined
          }
        });
        node.setState('highlight', false);
      });

      // Only apply highlighting if search term exists and is long enough
      if (searchTerm && searchTerm.length > 2) {
        const matchingNode = nodes.find((node: any) => {
          const nodeData = node.get('model').value;
          return nodeData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 nodeData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 nodeData.items.some((item: { text: string }) => 
                   item.text.toLowerCase().includes(searchTerm.toLowerCase())
                 );
        });

        if (matchingNode) {
          try {
            graphInstance.updateItem(matchingNode, {
              style: {
                stroke: '#ffff00',
                lineWidth: 5
              }
            });
            matchingNode.setState('highlight', true);
          } catch (error) {
            console.error('Error updating node style:', error);
          }
        }
      }
    }
  }, [searchTerm, graphInstance]);

  /**
   * Callback function that is called when the organization graph is ready and initialized
   * @param graph The graph instance from the visualization library
   * @description This handler stores the graph instance in component state so it can be
   * used later for animations and updates. The graph instance provides methods to manipulate
   * the visualization.
   */
  const handleGraphReady = (graph: any) => {
    setGraphInstance(graph);
    graph.on('node:click', (evt: any) => {
      handleNodeClick(evt.item);
    });
  };

  /**
   * Add click handler for nodes
   * @param node The node that was clicked
   * @description This handler sets the selected employee state to the clicked node's data
   */
  const handleNodeClick = (node: any) => {
    const nodeData = node.get('model');
    setSelectedEmployee({
      id: nodeData.id,
      name: nodeData.value.name,
      role: nodeData.value.title,
      department: nodeData.value.items.find((item: { text: string }) => 
        item.text.startsWith('Department'))?.text.split(': ')[1],
      email: nodeData.value.email,
      phone: nodeData.value.phone,
      startDate: nodeData.value.startDate,
      manager: nodeData.value.manager,
      location: nodeData.value.location,
    });
  };

  return (
    <div className="divide-y divide-gray-200 h-full flex flex-col relative">
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

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Employee Details</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium">Name</label>
                <p className="text-gray-600">{selectedEmployee.name}</p>
              </div>
              <div>
                <label className="font-medium">Role</label>
                <p className="text-gray-600">{selectedEmployee.role}</p>
              </div>
              <div>
                <label className="font-medium">Department</label>
                <p className="text-gray-600">{selectedEmployee.department || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Email</label>
                <p className="text-gray-600">{selectedEmployee.email || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Phone</label>
                <p className="text-gray-600">{selectedEmployee.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Start Date</label>
                <p className="text-gray-600">{selectedEmployee.startDate || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Manager</label>
                <p className="text-gray-600">{selectedEmployee.manager || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Location</label>
                <p className="text-gray-600">{selectedEmployee.location || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow overflow-auto">
        <OrganizationGraph 
          data={graphData} 
          style={{ width: '100%', height: '100%' }} 
          nodeCfg={nodeConfig}
          behaviors={['drag-canvas', 'zoom-canvas', 'drag-node']}
          onReady={handleGraphReady}
        />
      </div>
    </div>
  );
}