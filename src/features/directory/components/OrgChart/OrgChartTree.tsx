import React, { useState, useEffect, useRef } from "react";
import Tree, { RawNodeDatum, CustomNodeElementProps } from "react-d3-tree";
import { Employee } from "../../../../shared/types/directory.types";
import MemoizedTreeNodeComponent from "./TreeNodeComponent";
import "./styles/OrgChartTree.css";

interface TreeNode extends Employee {
  name: string;
  children: TreeNode[];
}

interface OrgChartTreeProps {
  node: TreeNode;
  onNodeClick: (employee: Employee) => void;
  searchQuery?: string;
}

const OrgChartTree: React.FC<OrgChartTreeProps> = ({ node, onNodeClick, searchQuery = "" }) => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to filter tree based on search query
  const filterTree = (node: TreeNode, query: string): TreeNode | null => {
    if (!query.trim()) {
      return node; // Return full tree if no search query
    }

    const queryLower = query.toLowerCase();
    const matchesNode = (
      node.first_name.toLowerCase().includes(queryLower) ||
      node.last_name.toLowerCase().includes(queryLower) ||
      node.role?.toLowerCase().includes(queryLower) ||
      `${node.first_name} ${node.last_name}`.toLowerCase().includes(queryLower)
    );

    // Filter children recursively
    const filteredChildren = node.children
      .map(child => filterTree(child, query))
      .filter(child => child !== null) as TreeNode[];

    // Include this node if it matches or if it has matching descendants
    if (matchesNode || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
  };

  // Get filtered tree data
  const filteredNode = filterTree(node, searchQuery);

  // Function to calculate tree dimensions
  const calculateTreeDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: 80 }); // Position tree higher up
    }
  };

  // Initial setup and window resize handler
  useEffect(() => {
    calculateTreeDimensions();

    const handleResize = () => {
      calculateTreeDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalculate when node data changes
  useEffect(() => {
    calculateTreeDimensions();
  }, [node]);

  const renderCustomNode = ({ nodeDatum }: CustomNodeElementProps) => (
    <foreignObject width="200" height="120" x="-100" y="-60">
      <div
        style={{ width: '200px', height: '120px', cursor: 'pointer' }}
        onClick={() => onNodeClick(nodeDatum as unknown as Employee)}
      >
        <MemoizedTreeNodeComponent 
          node={nodeDatum as unknown as TreeNode} 
          searchQuery={searchQuery}
        />
      </div>
    </foreignObject>
  );

  // If no nodes match the search, show a message
  if (!filteredNode) {
    return (
      <div ref={containerRef} className="org-chart-container">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No employees found matching "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
          </div>
        </div>
      </div>
    );
  }

  const treeData: RawNodeDatum[] = [filteredNode];

  // Calculate the zoom based on the number of nodes and container size
  const calculateZoom = () => {
    if (!filteredNode) return 1; // Default zoom if no filtered node
    
    const countNodes = (node: TreeNode): number => {
      let count = 1;
      if (node.children) {
        node.children.forEach(child => {
          count += countNodes(child);
        });
      }
      return count;
    };

    const totalNodes = countNodes(filteredNode);
    const baseZoom = Math.min(dimensions.width, dimensions.height) / (totalNodes * 150);
    return Math.min(Math.max(baseZoom, 0.3), 1.5); // Allow more zoom range
  };

  return (
    <div ref={containerRef} className="org-chart-container">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Tree
          data={treeData}
          orientation="vertical"
          translate={translate}
          pathFunc="elbow"
          nodeSize={{ x: 280, y: 160 }} // Increased spacing
          renderCustomNodeElement={renderCustomNode}
          zoom={calculateZoom()}
          separation={{ siblings: 2, nonSiblings: 2.5 }} // Increased separation
          enableLegacyTransitions={true}
          transitionDuration={800}
          pathClassFunc={() => "org-chart-link"}
        />
      )}
    </div>
  );
};

export default OrgChartTree;
