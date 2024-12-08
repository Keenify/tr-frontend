import { useState } from 'react';
import { type OrgMember } from '../types/org';

const departmentColors = {
  executive: 'bg-indigo-100 border-indigo-300',
  projects: 'bg-blue-100 border-blue-300',
  sales: 'bg-green-100 border-green-300',
  marketing: 'bg-yellow-100 border-yellow-300',
  operations: 'bg-purple-100 border-purple-300',
};

function transformOrgDataToGraph(orgData: OrgMember) {
  const nodes: Array<{ id: string; label: string; role: string; department: string; color: string }> = [];
  const edges: Array<{ source: string; target: string }> = [];

  function traverse(member: OrgMember) {
    // Add the current member as a node
    nodes.push({
      id: member.id,
      label: member.name,
      role: member.role,
      department: member.department,
      color: member.color,
    });

    // Add edges for each child
    if (member.children) {
      member.children.forEach((child) => {
        edges.push({
          source: member.id,
          target: child.id,
        });
        traverse(child); // Recursively process each child
      });
    }
  }

  traverse(orgData);

  return { nodes, edges };
}

export function useOrgData() {
  const [orgData] = useState<OrgMember>({
    id: '1',
    name: 'Robert Chen',
    role: 'CEO',
    department: 'executive',
    color: departmentColors.executive,
    children: [
      {
        id: '2',
        name: 'Sarah Miller',
        role: 'General Manager',
        department: 'executive',
        color: departmentColors.executive,
        children: [
          {
            id: '3',
            name: 'James Wilson',
            role: 'Director of Projects',
            department: 'projects',
            color: departmentColors.projects,
            children: [
              {
                id: 'p1',
                name: 'Project Alpha',
                role: 'Development Team',
                department: 'projects',
                color: departmentColors.projects,
                children: [
                  {
                    id: 'p1-1',
                    name: 'Mike Johnson',
                    role: 'Lead Developer',
                    department: 'projects',
                    color: departmentColors.projects,
                  },
                  {
                    id: 'p1-2',
                    name: 'Emma Davis',
                    role: 'Developer',
                    department: 'projects',
                    color: departmentColors.projects,
                  }
                ]
              },
              {
                id: 'p2',
                name: 'Project Beta',
                role: 'Design Team',
                department: 'projects',
                color: departmentColors.projects,
                children: [
                  {
                    id: 'p2-1',
                    name: 'Sophie Clark',
                    role: 'UX Lead',
                    department: 'projects',
                    color: departmentColors.projects,
                  }
                ]
              }
            ]
          },
          {
            id: '4',
            name: 'Emily Brown',
            role: 'Sales Manager',
            department: 'sales',
            color: departmentColors.sales,
            children: [
              {
                id: 's1',
                name: 'David Lee',
                role: 'Senior Sales Rep',
                department: 'sales',
                color: departmentColors.sales,
              },
              {
                id: 's2',
                name: 'Lisa Wang',
                role: 'Sales Rep',
                department: 'sales',
                color: departmentColors.sales,
              }
            ]
          },
          {
            id: '5',
            name: 'Alex Turner',
            role: 'Marketing Manager',
            department: 'marketing',
            color: departmentColors.marketing,
            children: [
              {
                id: 'm1',
                name: 'Ryan Martinez',
                role: 'Digital Marketing',
                department: 'marketing',
                color: departmentColors.marketing,
              },
              {
                id: 'm2',
                name: 'Jessica Kim',
                role: 'Content Strategy',
                department: 'marketing',
                color: departmentColors.marketing,
              }
            ]
          },
          {
            id: '6',
            name: 'Daniel Park',
            role: 'Operations Manager',
            department: 'operations',
            color: departmentColors.operations,
            children: [
              {
                id: 'o1',
                name: 'Chris Taylor',
                role: 'Logistics Lead',
                department: 'operations',
                color: departmentColors.operations,
              },
              {
                id: 'o2',
                name: 'Maria Garcia',
                role: 'Supply Chain',
                department: 'operations',
                color: departmentColors.operations,
              }
            ]
          }
        ]
      }
    ]
  });

  const graphData = transformOrgDataToGraph(orgData);

  return { orgData, departmentColors, graphData };
}