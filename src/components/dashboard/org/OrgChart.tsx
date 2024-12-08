import { Tree } from 'antd';
import { type OrgMember } from '../../../types/org';
import { OrgNode } from './OrgNode';

interface OrgChartProps {
  data: OrgMember;
  searchTerm: string;
}

export function OrgChart({ data, searchTerm }: OrgChartProps) {
  const renderTreeNodes = (node: OrgMember): any => ({
    title: <OrgNode member={node} searchTerm={searchTerm} />,
    key: node.id,
    children: node.children ? node.children.map(renderTreeNodes) : [],
  });

  return (
    <div className="flex justify-center pt-8 w-full overflow-x-auto">
      <Tree
        treeData={[renderTreeNodes(data)]}
        defaultExpandAll
        blockNode
      />
    </div>
  );
}