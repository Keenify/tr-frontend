import React from "react";
import Tree, { RawNodeDatum } from "react-d3-tree";
import { Employee } from "../../types/directory.types";
import MemoizedTreeNodeComponent from "./TreeNodeComponent";
import "./OrgChartTree.css";

interface TreeNode extends Employee {
  name: string;
  children: TreeNode[];
}

interface OrgChartTreeProps {
  node: TreeNode;
}

const OrgChartTree: React.FC<OrgChartTreeProps> = ({ node }) => {
  const treeData: RawNodeDatum[] = [node];

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: RawNodeDatum }) => (
    <foreignObject width="150" height="100" x="-75" y="-50">
      <div style={{ width: '150px', height: '100px' }}>
        <MemoizedTreeNodeComponent node={nodeDatum as TreeNode} />
      </div>
    </foreignObject>
  );

  return (
    <div className="org-chart-container">
      <Tree
        data={treeData}
        orientation="vertical"
        translate={{ x: 200, y: 100 }}
        pathFunc="elbow"
        nodeSize={{ x: 220, y: 120 }}
        renderCustomNodeElement={renderCustomNode}
      />
    </div>
  );
};

export default OrgChartTree;
