import { useCallback, useRef, useState, useEffect } from 'react';
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
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/mindmap.css';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { 
  createMindMap, 
  updateMindMap, 
  getMindMap, 
  MindMapData,
  CreateMindMapRequest 
} from '../services/useMindMap';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

import MindMapNode from './MindMapNode/MindMapNode';
import MindMapEdge from './MindMapEdge/MindMapEdge';

// Define these outside the component
const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };

interface MindMapProps {
  session: Session;
  mindmapId?: string; // Optional - if not provided, we're creating a new mindmap
}

function Flow({ session, mindmapId }: MindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('Double click to edit title');
  const [description, setDescription] = useState('Double click to edit description');
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMindMapId, setCurrentMindMapId] = useState<string | undefined>(mindmapId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { userInfo, companyInfo } = useUserAndCompanyData(session.user.id);

  // Initialize or fetch mindmap data
  useEffect(() => {
    const initializeMindMap = async () => {
      setIsLoading(true);
      try {
        if (!mindmapId || mindmapId === 'new') {
          // Initialize new mindmap
          const initialNode = {
            id: 'root',
            type: 'mindmap',
            data: { 
              label: 'Root Node',
              description: 'Start your mind map here'
            },
            position: { x: 0, y: 0 },
            dragHandle: '.dragHandle',
          };
          
          setNodes([initialNode]);
          setEdges([]);
          setTitle('New Mind Map');
          setDescription('Add a description for your mind map');
          setIsLoading(false);
        } else {
          // Fetch existing mindmap
          const mindmapData = await getMindMap(mindmapId);
          setTitle(mindmapData.title);
          setDescription(mindmapData.description);
          setNodes(mindmapData.mindmap.nodes);
          setEdges(mindmapData.mindmap.edges);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing mindmap:', err);
        setError('Failed to initialize mind map');
        setIsLoading(false);
      }
    };

    initializeMindMap();
  }, [mindmapId, setNodes, setEdges]);

  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const getChildNodePosition = useCallback(
    (event: MouseEvent, parentNode?: Node) => {
      if (!parentNode?.positionAbsolute || !parentNode?.width || !parentNode?.height) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      return {
        x: position.x - parentNode.positionAbsolute.x + parentNode.width / 2,
        y: position.y - parentNode.positionAbsolute.y + parentNode.height / 2,
      };
    },
    [screenToFlowPosition]
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
          data: { 
            label: 'New Node',
            description: '',
            isEditing: false 
          },
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

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setHasUnsavedChanges(true);
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setHasUnsavedChanges(true);
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = useCallback(async () => {
    if (!companyInfo?.id) {
      setError('Company information not available');
      return;
    }

    const mindMapData: MindMapData = {
      title,
      description,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'mindmap',
        data: {
          label: node.data.label,
          description: node.data.description,
        },
        position: node.position,
        parentNode: node.parentNode,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'mindmap',
      })),
    };

    try {
      if (currentMindMapId) {
        // Update existing mindmap
        await updateMindMap(
          currentMindMapId,
          userInfo?.id || '',
          {
            title,
            description,
            mindmap: mindMapData
          }
        );
        toast.success('Mind map updated successfully');
      } else {
        // Create new mindmap
        const createRequest: CreateMindMapRequest = {
          title,
          description,
          mindmap: mindMapData,
          company_id: companyInfo.id,
          created_by: userInfo?.id || ''
        };
        const newMindMap = await createMindMap(createRequest);
        setCurrentMindMapId(newMindMap.id); // Set the new mindmap ID after creation
        toast.success('Mind map created successfully');
      }
      setHasUnsavedChanges(false); // Reset unsaved changes after successful save
    } catch (err) {
      setError('Failed to save mindmap');
      console.error(err);
      toast.error('Failed to save mind map');
    }
  }, [title, description, nodes, edges, currentMindMapId, companyInfo?.id, userInfo?.id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
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
          <Panel position="top-left" className="header z-50 mt-16">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className={`px-2 py-1 text-xl font-semibold ${
                  isTitleEditing 
                    ? 'border rounded bg-white' 
                    : 'border-none bg-transparent text-black'
                }`}
                value={title}
                placeholder="Double click to edit title"
                readOnly={!isTitleEditing}
                onDoubleClick={() => setIsTitleEditing(true)}
                onChange={handleTitleChange}
                onBlur={() => setIsTitleEditing(false)}
              />
              <textarea
                className={`px-2 py-1 text-sm ${
                  isDescriptionEditing 
                    ? 'border rounded resize-none bg-white' 
                    : 'border-none bg-transparent text-black resize-none'
                }`}
                rows={2}
                value={description}
                placeholder="Double click to edit description"
                readOnly={!isDescriptionEditing}
                onDoubleClick={() => setIsDescriptionEditing(true)}
                onChange={handleDescriptionChange}
                onBlur={() => setIsDescriptionEditing(false)}
              />
            </div>
          </Panel>
          <Panel position="top-right" className="z-50">
            <button 
              onClick={handleSave}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {hasUnsavedChanges ? '* Save Changes' : (currentMindMapId ? 'Update Mind Map' : 'Create Mind Map')}
            </button>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
}

export default Flow;