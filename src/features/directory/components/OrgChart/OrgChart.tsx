import { useState, useEffect, useCallback } from "react";
import noOrgChartImage from "../../assets/org_chart.svg";
import { OrgChartConfigPanel } from "./OrgChartConfigPanel";
import { directoryService } from "../../../../shared/services/directoryService";
import { Employee } from "../../../../shared/types/directory.types";
import OrgChartTree from "./OrgChartTree";
import { EmployeePanel } from "../EmployeePanel";

/**
 * Props for OrgChart component.
 * @param companyId - The ID of the company for which the org chart is displayed.
 */
interface OrgChartProps {
  companyId: string;
}

/**
 * TreeNode interface extends Employee and adds a children property.
 */
interface TreeNode extends Employee {
  name: string;
  children: TreeNode[];
}

/**
 * OrgChart component displays the organizational chart for a given company.
 * It allows users to toggle between viewing people and roles, search within the chart,
 * and open a configuration panel to build the people chart.
 *
 * @param companyId - The ID of the company for which the org chart is displayed.
 * @returns JSX.Element - The rendered org chart component.
 */
export const OrgChart = ({ companyId }: OrgChartProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [isEmployeePanelOpen, setIsEmployeePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const employeesData = await directoryService.fetchEmployees(companyId);
      
      // Filter to only show employed employees OR the backup user (special case)
      const employedEmployees = employeesData.filter(employee => 
        employee.Is_Employed || employee.first_name.toLowerCase() === 'backup'
      );
      
      setEmployees(employedEmployees);

      // Log employees data
      console.log("Employees data:", JSON.stringify(employedEmployees, null, 2));

      // Check if there are employees in the hierarchy (either highest_rank or reports_to someone)
      // OR if there are employees who don't report to anyone (potential roots)
      const hasHierarchy = employedEmployees.some(emp => emp.highest_rank || emp.reports_to);
      const hasPotentialRoots = employedEmployees.some(emp => !emp.reports_to);
      
      if (hasHierarchy || hasPotentialRoots) {
        setTreeData(transformToTree(employedEmployees));
      } else {
        setTreeData(null);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleNodeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeePanelOpen(true);
  };

  // Get unassigned employees (those who don't report to anyone AND are not the highest ranking executive)
  // These are employees that should be shown separately from the hierarchy
  const unassignedEmployees = employees.filter(emp => !emp.reports_to && !emp.highest_rank);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">Org chart</h1>
        <p className="text-gray-600">
          A one-stop shop to see who reports to who. Accuracy depends on
          everyone having the "Reports to" field filled on their profile.
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white border-b">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex w-full sm:w-auto space-x-4">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
            <button
              onClick={() => setIsConfigPanelOpen(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors whitespace-nowrap"
            >
              Build people chart
            </button>
            {unassignedEmployees.length > 0 && (
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors whitespace-nowrap flex items-center gap-2"
                title={`${unassignedEmployees.length} unassigned employee${unassignedEmployees.length > 1 ? 's' : ''}`}
              >
                <span className="text-lg">!</span>
                <span>{unassignedEmployees.length}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Org Chart Tree */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
          ) : treeData ? (
            <OrgChartTree 
              node={treeData} 
              onNodeClick={handleNodeClick} 
              searchQuery={searchQuery}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <img
                src={noOrgChartImage}
                alt="No org chart"
                className="w-96 h-96 mb-8"
              />
              <h2 className="text-xl font-semibold text-gray-900">
                An Org chart hasn't been created yet
              </h2>
            </div>
          )}
        </div>

        {/* Unassigned Employees Sidebar */}
        {unassignedEmployees.length > 0 && (
          <div className="w-80 bg-white border-l overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500 text-lg font-bold">!</span>
                <h3 className="font-semibold text-gray-900">Unassigned Employees</h3>
              </div>
              <p className="text-sm text-gray-600">Employees not reporting to anyone.</p>
            </div>
            <div className="p-4 space-y-3">
              {unassignedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleNodeClick(employee)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                      {employee.profile_pic_url ? (
                        <img
                          src={employee.profile_pic_url}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {`${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {`${employee.first_name} ${employee.last_name}`}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {employee.role || 'No role assigned'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Employee Panel */}
      <EmployeePanel
        employee={selectedEmployee}
        isOpen={isEmployeePanelOpen}
        onClose={() => setIsEmployeePanelOpen(false)}
      />

      {/* Add the config panel */}
      <OrgChartConfigPanel
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        companyId={companyId}
        onUpdate={fetchEmployees}
      />
    </div>
  );
};

/**
 * Transforms the list of employees into a tree structure.
 * @param employees - The list of employees to transform.
 * @returns The root node of the tree or null if the transformation fails.
 */
const transformToTree = (employees: Employee[]): TreeNode | null => {
  const idToNodeMap: { [key: string]: TreeNode } = {};
  let root: TreeNode | null = null;

  // First, create all nodes
  employees.forEach((employee) => {
    idToNodeMap[employee.id] = {
      ...employee,
      name: `${employee.first_name} ${employee.last_name}`,
      children: [],
    };
  });

  // Find the root node (employee with highest_rank = true)
  const highestRankEmployee = employees.find(emp => emp.highest_rank);
  if (highestRankEmployee) {
    root = idToNodeMap[highestRankEmployee.id];
  } else {
    // If no highest_rank employee is set, find employees who don't report to anyone
    // and use the first one as root (this handles cases where hierarchy exists but no CEO is marked)
    const potentialRoots = employees.filter(emp => !emp.reports_to);
    if (potentialRoots.length > 0) {
      root = idToNodeMap[potentialRoots[0].id];
    }
  }

  // Build the tree structure by connecting children to their parents
  employees.forEach((employee) => {
    if (employee.reports_to && idToNodeMap[employee.reports_to]) {
      idToNodeMap[employee.reports_to].children.push(idToNodeMap[employee.id]);
    }
  });

  return root;
};

