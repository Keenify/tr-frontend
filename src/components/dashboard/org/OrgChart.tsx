import { OrgNode } from './OrgNode';
import { type OrgMember } from '../../../types/org';

interface OrgChartProps {
  data: OrgMember;
  searchTerm: string;
}

export function OrgChart({ data, searchTerm }: OrgChartProps) {
  const renderNode = (node: OrgMember, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="relative flex flex-col items-center">
        {/* Vertical line from parent */}
        {level > 0 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-gray-300" />
        )}
        
        {/* Node */}
        <div className="relative">
          <OrgNode member={node} isRoot={level === 0} searchTerm={searchTerm} />
        </div>
        
        {/* Children container */}
        {hasChildren && (
          <div className="flex flex-col items-center">
            {/* Vertical line down */}
            <div className="w-[2px] h-8 bg-gray-300 mt-2" />
            
            {/* Horizontal line for multiple children */}
            {node.children!.length > 1 && (
              <div 
                className="h-[2px] bg-gray-300"
                style={{
                  width: `${Math.max((node.children!.length - 1) * 16, 16)}rem`
                }}
              />
            )}
            
            {/* Children */}
            <div className="flex gap-16 relative">
              {node.children!.map((child, index) => (
                <div key={child.id} className="relative">
                  {/* Vertical line to child */}
                  {node.children!.length > 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-gray-300" />
                  )}
                  {renderNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex justify-center pt-8 w-full overflow-x-auto"> {/* Added overflow-x-auto */}
      {renderNode(data, 0)}
    </div>
  );
}