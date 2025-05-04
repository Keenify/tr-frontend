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

/**
 * Interface for MindMap component props
 */
interface MindMapProps {
  /** Active user session */
  session: Session;
  /** Optional ID of existing mindmap. If not provided, creates a new mindmap */
  mindmapId?: string;
}

/**
 * MindMap Flow Component
 * 
 * A React component that provides an interactive mind mapping interface using ReactFlow.
 * Supports creating new mind maps or editing existing ones with features like:
 * - Drag and drop node creation
 * - Node connections
 * - Editable titles and descriptions
 * - Auto-save functionality
 * - Unsaved changes detection
 * 
 * @param {MindMapProps} props - Component props
 * @returns {JSX.Element} Mind map interface
 */
function Flow({ session, mindmapId }: MindMapProps) {
  // State for showing/hiding instructions panel
  // Only show instructions when info icon is clicked
  const [showInstructions, setShowInstructions] = useState(false);
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
              description: 'Start your mind map here',
              color: '#F6AD55'
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

  /**
   * Calculates the position for a new child node relative to its parent
   * @param {MouseEvent} event - Mouse event containing click coordinates
   * @param {Node} parentNode - Optional parent node reference
   * @returns {Position | undefined} Calculated position or undefined
   */
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

  /**
   * Handles the start of a connection between nodes
   * @param {OnConnectStart} _ - Unused connect event
   * @param {Object} params - Connection parameters containing nodeId
   */
  const onConnectStart: OnConnectStart = useCallback((_, params) => {
    connectingNodeId.current = params.nodeId;
  }, []);

  /**
   * Handles the completion of a connection, creating new nodes when connecting to empty space
   * @param {MouseEvent | TouchEvent} event - Connection end event
   */
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
            color: parentNode.data.color || '#F6AD55',
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

  /**
   * Saves the current mind map state to the backend
   * Creates a new mind map or updates an existing one based on currentMindMapId
   * @returns {Promise<void>}
   */
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
          color: node.data.color || '#F6AD55'
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
      {/* Help Icon Button */}
      <button
        onClick={() => setShowInstructions(true)}
        style={{
          position: 'fixed',
          top: 28,
          right: 36,
          zIndex: 200,
          background: 'transparent',
          border: 'none',
          padding: 0,
          width: 54,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Show Mind Map Instructions"
        title="Show Mind Map Instructions"
      >
      </button>

      {/* Instructions Modal/Overlay */}
      {showInstructions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(31, 41, 55, 0.25)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '32px 28px 24px 28px',
            maxWidth: '680px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 18,
                background: 'transparent',
                border: 'none',
                fontSize: 26,
                cursor: 'pointer',
                color: '#6b7280',
                fontWeight: 700,
              }}
              aria-label="Close instructions"
              title="Close instructions"
            >
              ×
            </button>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>How to Use the Mind Map</h2>
            <ol style={{ paddingLeft: 24, margin: 0, color: '#334155', fontSize: '1rem' }}>
              <li style={{ marginBottom: 8 }}><b>Create or Edit a Mind Map:</b> If you're starting fresh, a root node will appear. If you're editing, your existing mind map will load automatically.</li>
              <li style={{ marginBottom: 8 }}><b>Edit Title and Description:</b> Double-click the title or description at the top-left to edit them. Click outside or press enter to save your changes.</li>
              <li style={{ marginBottom: 8 }}><b>Add Nodes:</b> To add a node, point to an existing node until you see the <b>+</b> icon, then drag to empty space.</li>
              <li style={{ marginBottom: 8 }}><b>Connect Nodes:</b> Drag from a node's handle to another node to create a connection (edge) between them.</li>
              <li style={{ marginBottom: 8 }}><b>Edit Node Content:</b> Double-click any node to edit its label or description.</li>
              <li style={{ marginBottom: 8 }}><b>Save Your Work:</b> Click the "Save Changes" or "Update Mind Map" button at the top-right to save your progress. Unsaved changes will be indicated.</li>
              <li style={{ marginBottom: 8 }}><b>Auto-Save & Warnings:</b> The tool auto-detects unsaved changes and warns you if you try to leave before saving.</li>
            </ol>
          </div>
        </div>
      )}


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
          <Panel position="top-left" className="header z-50 mt-16 w-full px-4">
            <div className="flex justify-between items-start gap-4">
              {/* Left side: Title and Description */}
              <div className="flex flex-col gap-2 w-[600px]">
                <input
                  type="text"
                  className={`font-semibold transition-all duration-150 ${
                    isTitleEditing
                      ? 'text-2xl bg-white border-blue-500 border-2 shadow-lg text-black'
                      : 'text-xl bg-gray-50 border border-gray-300 shadow-sm text-black'
                  }`}
                  style={{
                    minWidth: 220,
                    maxWidth: 600,
                    borderRadius: 8,
                    padding: '10px 16px',
                    outline: 'none',
                    marginBottom: 4, // Increased space below title
                  }}
                  value={title}
                  placeholder="Double click to edit title"
                  readOnly={!isTitleEditing}
                  onDoubleClick={() => setIsTitleEditing(true)}
                  onChange={handleTitleChange}
                  onBlur={() => setIsTitleEditing(false)}
                />
                <textarea
                  className={`transition-all duration-150 resize-none ${
                    isDescriptionEditing
                      ? 'text-base bg-white border-blue-500 border-2 shadow-lg text-black'
                      : 'text-sm bg-gray-50 border border-gray-300 shadow-sm text-black'
                  }`}
                  style={{
                    minWidth: 220,
                    maxWidth: 600,
                    borderRadius: 8,
                    padding: '10px 16px',
                    outline: 'none',
                    overflowY: 'hidden', // Hide scrollbar initially
                    minHeight: '40px', // Minimum height for one line
                  }}
                  value={description}
                  placeholder="Double click to edit description"
                  readOnly={!isDescriptionEditing}
                  onDoubleClick={() => setIsDescriptionEditing(true)}
                  onChange={(e) => {
                    handleDescriptionChange(e);
                    // Auto-resize height
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onBlur={(e) => {
                    setIsDescriptionEditing(false);
                    // Ensure height is reset on blur if empty or matches content
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  // Set initial height on load
                  ref={(textarea) => {
                    if (textarea) {
                      textarea.style.height = 'auto';
                      textarea.style.height = `${textarea.scrollHeight}px`;
                    }
                  }}
                />
              </div>

              {/* Right side: Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm font-semibold transition-all"
                >
                  {hasUnsavedChanges ? '* Save Changes' : (currentMindMapId ? 'Update Mind Map' : 'Create Mind Map')}
                </button>
                <button
                  onClick={() => setShowInstructions(true)}
                  aria-label="Show Mind Map Instructions"
                  title="Show Mind Map Instructions"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {/* Material Design Info SVG */}
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#2563eb"/>
                    <path d="M12 16v-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8.5" r="1.2" fill="#fff"/>
                  </svg>
                </button>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
}

export default Flow;