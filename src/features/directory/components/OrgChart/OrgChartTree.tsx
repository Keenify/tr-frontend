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
}

const OrgChartTree: React.FC<OrgChartTreeProps> = ({ node, onNodeClick }) => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to calculate tree dimensions
  const calculateTreeDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: height / 6 }); // Adjust vertical position to 1/6 of height
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
    <foreignObject width="150" height="100" x="-75" y="-50">
      <div
        style={{ width: '150px', height: '100px', cursor: 'pointer' }}
        onClick={() => onNodeClick(nodeDatum as unknown as Employee)}
      >
        <MemoizedTreeNodeComponent node={nodeDatum as unknown as TreeNode} />
      </div>
    </foreignObject>
  );

  const treeData: RawNodeDatum[] = [node];

  // Calculate the zoom based on the number of nodes and container size
  const calculateZoom = () => {
    const countNodes = (node: TreeNode): number => {
      let count = 1;
      if (node.children) {
        node.children.forEach(child => {
          count += countNodes(child);
        });
      }
      return count;
    };

    const totalNodes = countNodes(node);
    const baseZoom = Math.min(dimensions.width, dimensions.height) / (totalNodes * 100);
    return Math.min(Math.max(baseZoom, 0.4), 1.2); // Limit zoom between 0.4 and 1.2
  };

  return (
    <div ref={containerRef} className="org-chart-container">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Tree
          data={treeData}
          orientation="vertical"
          translate={translate}
          pathFunc="elbow"
          nodeSize={{ x: 220, y: 120 }}
          renderCustomNodeElement={renderCustomNode}
          zoom={calculateZoom()}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          enableLegacyTransitions={true}
          transitionDuration={800}
        />
      )}
    </div>
  );
};

export default OrgChartTree;
