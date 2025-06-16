import React from "react";
import { Employee } from "../../../../shared/types/directory.types";
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
 * @param searchQuery - The search query to highlight in the node.
 */
interface TreeNodeComponentProps {
  node: TreeNode;
  searchQuery?: string;
}

/**
 * TreeNodeComponent renders a single node in the org chart.
 * It displays the employee's name, role, and avatar or initials.
 *
 * @param node - The current tree node to render.
 * @param searchQuery - The search query to highlight in the node.
 * @returns JSX.Element - The rendered tree node.
 */
const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, searchQuery = "" }) => {
  // Function to get initials if profile picture is not available
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  // Function to highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return text;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const fullName = `${node.first_name} ${node.last_name}`;

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
          {highlightText(fullName, searchQuery)}
        </div>
        <div className="role">
          {node.role ? highlightText(node.role, searchQuery) : ''}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TreeNodeComponent);