import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useOrgData } from '../../../hooks/useOrgData';
import { SearchBar } from './Org/SearchBar';
import { EmployeeDetailsModal } from './Org/EmployeeDetailsModal';
import { OrgGraph } from './Org/OrgGraph';
import { OrgMember } from './Org/types';

/**
 * Org component that displays an organizational chart and provides search functionality.
 * 
 * This component fetches organizational data using the `useOrgData` hook and displays it
 * in an interactive graph format using the `OrganizationGraph` component. It also includes
 * a search bar to filter members and a button to add new members.
 */
export function Org() {
  // State to hold the organizational data fetched from the custom hook
  const { orgData } = useOrgData();
  // State to manage the current search term entered by the user
  const [searchTerm, setSearchTerm] = useState('');
  // State to store the instance of the graph once it is initialized
  const [graphInstance, setGraphInstance] = useState<any>(null);
  // State to keep track of the currently selected employee in the graph
  const [selectedEmployee, setSelectedEmployee] = useState<OrgMember | null>(null);

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

  // Convert the organizational data into a format suitable for the graph
  const graphData = convertToGraphData(orgData);

  // Configuration for the nodes in the graph
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

  // Effect to handle highlighting of nodes based on the search term
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
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <button className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Employee Details Modal */}
      <EmployeeDetailsModal selectedEmployee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />

      {/* Content */}
      <div className="flex-grow overflow-auto">
        <OrgGraph graphData={graphData} nodeConfig={nodeConfig} onGraphReady={handleGraphReady} />
      </div>
    </div>
  );
}