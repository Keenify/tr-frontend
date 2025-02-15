import { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  ConnectionLineType,
  NodeOrigin,
  Node,
  useReactFlow,
  useStoreApi,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  OnConnectStart,
  OnConnectEnd,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/mindmap.css';

import MindMapNode from './MindMapNode/MindMapNode';
import MindMapEdge from './MindMapEdge/MindMapEdge';

const initialNodes = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'React Flow Mind Map' },
    position: { x: 0, y: 0 },
    dragHandle: '.dragHandle',
  },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const store = useStoreApi();
  const { project } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), []);
  const edgeTypes = useMemo(() => ({ mindmap: MindMapEdge }), []);

  const getChildNodePosition = useCallback(
    (event: MouseEvent, parentNode?: Node) => {
      const { domNode } = store.getState();
      if (!domNode || !parentNode?.positionAbsolute || !parentNode?.width || !parentNode?.height) {
        return;
      }

      const { top, left } = domNode.getBoundingClientRect();
      const panePosition = project({
        x: event.clientX - left,
        y: event.clientY - top,
      });

      return {
        x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
        y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
      };
    },
    [project, store]
  );

  const onConnectStart: OnConnectStart = useCallback((_, params) => {
    connectingNodeId.current = params.nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!(event instanceof MouseEvent)) return; // Guard for TouchEvent
    const { nodeInternals } = store.getState();
    const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
    const node = (event.target as Element).closest('.react-flow__node');

    if (node) {
      node.querySelector('input')?.focus({ preventScroll: true });
    } else if (targetIsPane && connectingNodeId.current) {
      const parentNode = nodeInternals.get(connectingNodeId.current);
      const childNodePosition = getChildNodePosition(event, parentNode);

      if (parentNode && childNodePosition) {
        const newNode = {
          id: crypto.randomUUID(),
          type: 'mindmap',
          data: { label: 'New Node' },
          position: childNodePosition,
          dragHandle: '.dragHandle',
          parentNode: parentNode.id,
        };

        const newEdge = {
          id: crypto.randomUUID(),
          source: parentNode.id,
          target: newNode.id,
          type: 'mindmap',
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);
      }
    }
  }, [getChildNodePosition, setNodes, setEdges, store]);

  const nodeOrigin: NodeOrigin = [0.5, 0.5];
  const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 };
  const defaultEdgeOptions = { style: connectionLineStyle, type: 'mindmap' };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.Straight}
      fitView
    >
      <Controls showInteractive={false} />
      <Panel position="top-left" className="header">
        React Flow Mind Map
      </Panel>
    </ReactFlow>
  );
}

export default Flow;