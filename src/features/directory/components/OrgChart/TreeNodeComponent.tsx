import React from "react";
import { Employee } from "../../types/directory.types";

/**
 * TreeNode interface extends Employee and adds a children property.
 */
interface TreeNode extends Employee {
  children: TreeNode[];
}

/**
 * Props for TreeNodeComponent.
 * @param node - The current tree node to render.
 */
interface TreeNodeComponentProps {
  node: TreeNode;
}

/**
 * TreeNodeComponent renders a single node in the org chart.
 * It displays the employee's name, role, and avatar or initials.
 *
 * @param node - The current tree node to render.
 * @returns JSX.Element - The rendered tree node.
 */
const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node }) => {
  // Function to get initials if profile picture is not available
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  return (
    <div className="border rounded-lg shadow-md p-4 bg-white max-w-xs mx-auto relative">
      <div className="absolute -top-6 left-4">
        {node.profile_pic_url ? (
          <img
            src={node.profile_pic_url}
            alt={`${node.first_name} ${node.last_name}`}
            className="w-12 h-12 rounded-full border-2 border-white"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold border-2 border-white">
            {getInitials(node.first_name, node.last_name)}
          </div>
        )}
      </div>
      <div className="flex items-start space-x-4 mt-6">
        <div>
          <div className="font-bold text-orange-600">
            {node.first_name} {node.last_name}
          </div>
          <div className="text-sm text-gray-500">{node.role}</div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="mt-2">
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNodeComponent;