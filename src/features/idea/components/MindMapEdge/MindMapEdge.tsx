import { BaseEdge, EdgeProps, getStraightPath } from 'reactflow';

/**
 * MindMapEdge is a custom edge component for React Flow that renders a straight line
 * between two nodes in a mind map visualization.
 * 
 * @param props - The edge properties from React Flow
 * @param props.sourceX - X coordinate of the source node
 * @param props.sourceY - Y coordinate of the source node
 * @param props.targetX - X coordinate of the target node
 * @param props.targetY - Y coordinate of the target node
 * @returns A rendered edge component connecting two nodes
 */
function MindMapEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY } = props;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY: sourceY + 18,
    targetX,
    targetY,
  });

  return <BaseEdge path={edgePath} {...props} />;
}

export default MindMapEdge;