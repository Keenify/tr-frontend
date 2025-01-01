import React from "react";
import { Employee } from "../../types/directory.types";
import "./styles/TreeNodeComponent.css";

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
    <div className="tree-node">
      <div className="avatar">
        {node.profile_pic_url ? (
          <img
            src={node.profile_pic_url}
            alt={`${node.first_name} ${node.last_name}`}
          />
        ) : (
          <div className="initials">
            {getInitials(node.first_name, node.last_name)}
          </div>
        )}
      </div>
      <div className="text-content">
        <div className="name">
          {node.first_name} {node.last_name}
        </div>
        <div className="role">{node.role}</div>
      </div>
    </div>
  );
};

export default React.memo(TreeNodeComponent);