import { useState, useEffect, useCallback } from "react";
import noOrgChartImage from "../../assets/org_chart.svg";
import { OrgChartConfigPanel } from "./OrgChartConfigPanel";
import { directoryService } from "../../services/directoryService";
import { Employee } from "../../types/directory.types";
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
  const [activeTab, setActiveTab] = useState<"people" | "roles">("people");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [, setEmployees] = useState<Employee[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [isEmployeePanelOpen, setIsEmployeePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const employeesData = await directoryService.fetchEmployees(companyId);
      setEmployees(employeesData);

      // Log employees data
      console.log("Employees data:", JSON.stringify(employeesData, null, 2));

      // Check if there is an employee with the highest rank
      const hasHighestRank = employeesData.some(emp => emp.highest_rank);
      if (hasHighestRank) {
        setTreeData(transformToTree(employeesData));
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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Org chart</h1>
        <p className="text-gray-600">
          A one-stop shop to see who reports to who. Accuracy depends on
          everyone having the "Reports to" field filled on their profile.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("people")}
            className={`px-4 py-2 font-medium ${
              activeTab === "people"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 font-medium ${
              activeTab === "roles"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Roles
          </button>
        </div>

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
        </div>
      </div>

      {/* Org Chart Tree */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
          </div>
        ) : treeData ? (
          <OrgChartTree node={treeData} onNodeClick={handleNodeClick} />
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

  employees.forEach((employee) => {
    idToNodeMap[employee.id] = {
      ...employee,
      name: `${employee.first_name} ${employee.last_name}`,
      children: [],
    };
  });

  employees.forEach((employee) => {
    if (employee.reports_to) {
      idToNodeMap[employee.reports_to].children.push(idToNodeMap[employee.id]);
    } else {
      root = idToNodeMap[employee.id];
    }
  });

  return root;
};

