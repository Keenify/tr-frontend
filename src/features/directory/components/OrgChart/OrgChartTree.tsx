import React, { useState, useEffect } from "react";
import Tree, { RawNodeDatum, CustomNodeElementProps } from "react-d3-tree";
import { Employee } from "../../types/directory.types";
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

  useEffect(() => {
    const dimensions = document
      .querySelector(".org-chart-container")
      ?.getBoundingClientRect();
    if (dimensions) {
      setTranslate({
        x: dimensions.width / 2,
        y: dimensions.height / 4,
      });
    }
  }, []);

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

  return (
    <div className="org-chart-container">
      <Tree
        data={treeData}
        orientation="vertical"
        translate={translate}
        pathFunc="elbow"
        nodeSize={{ x: 220, y: 120 }}
        renderCustomNodeElement={renderCustomNode}
      />
    </div>
  );
};

export default OrgChartTree;
