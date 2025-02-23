import {
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    XYPosition,
  } from 'reactflow';
  import { create } from 'zustand';
  import { nanoid } from 'nanoid/non-secure';
  
  import { NodeData } from './MindMapNode/MindMapNode';
  
  /**
   * React Flow State type definition
   * Manages the state of nodes and edges in the mind map
   */
  export type RFState = {
    /** Array of mind map nodes */
    nodes: Node<NodeData>[];
    /** Array of edges connecting the nodes */
    edges: Edge[];
    /** Callback function to handle node changes */
    onNodesChange: OnNodesChange;
    /** Callback function to handle edge changes */
    onEdgesChange: OnEdgesChange;
    /** Updates the label of a specific node */
    updateNodeLabel: (nodeId: string, label: string) => void;
    /** Adds a new child node connected to a parent node */
    addChildNode: (parentNode: Node, position: XYPosition) => void;
    /** Deletes a node and all its descendants */
    deleteNode: (nodeId: string) => void;
    /** Updates the color of a specific node */
    updateNodeColor: (nodeId: string, color: string) => void;
  };
  
  const initialNodes: Node[] = [
    {
      id: 'root',
      type: 'mindmap',
      data: { label: 'React Flow Mind Map' },
      position: { x: 0, y: 0 },
      dragHandle: '.dragHandle',
    },
  ];
  
  const useStore = create<RFState>((set, get) => ({
    nodes: initialNodes,
    edges: [],
    
    /**
     * Handles changes to nodes (e.g., position, deletion)
     * @param changes Array of node changes to apply
     */
    onNodesChange: (changes: NodeChange[]) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },

    /**
     * Handles changes to edges (e.g., deletion, connection)
     * @param changes Array of edge changes to apply
     */
    onEdgesChange: (changes: EdgeChange[]) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },

    /**
     * Updates the label text of a specific node
     * @param nodeId ID of the node to update
     * @param label New label text
     */
    updateNodeLabel: (nodeId: string, label: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, label },
            };
          }
          return node;
        }),
      });
    },

    /**
     * Creates a new child node connected to the specified parent node
     * @param parentNode Parent node to connect to
     * @param position X/Y coordinates for the new node
     */
    addChildNode: (parentNode: Node, position: XYPosition) => {
      const newNode: Node<NodeData> = {
        id: nanoid(),
        type: 'mindmap',
        data: { 
          label: 'New Node',
          description: '',
          color: (parentNode.data as NodeData).color || '#F6AD55'
        },
        position,
        dragHandle: '.dragHandle',
        parentNode: parentNode.id,
      };
  
      const newEdge = {
        id: nanoid(),
        source: parentNode.id,
        target: newNode.id,
        type: 'mindmap',
      };
  
      set((state) => ({
        nodes: [...state.nodes, newNode],
        edges: [...state.edges, newEdge],
      }));
    },

    /**
     * Deletes a node and all its descendant nodes recursively
     * @param nodeId ID of the node to delete
     */
    deleteNode: (nodeId: string) => {
      /**
       * Helper function to find all descendant nodes
       * @param currentId ID of the current node
       * @returns Array of descendant node IDs
       */
      const getDescendantNodes = (currentId: string): string[] => {
        const descendants: string[] = [];
        const edges = get().edges;
        
        const findChildren = (id: string) => {
          const childEdges = edges.filter(edge => edge.source === id);
          childEdges.forEach(edge => {
            descendants.push(edge.target);
            findChildren(edge.target);
          });
        };
        
        findChildren(currentId);
        return descendants;
      };

      const descendantIds = getDescendantNodes(nodeId);
      const allNodesToDelete = [nodeId, ...descendantIds];

      set(state => ({
        nodes: state.nodes.filter(node => !allNodesToDelete.includes(node.id)),
        edges: state.edges.filter(edge => 
          !allNodesToDelete.includes(edge.source) && !allNodesToDelete.includes(edge.target)
        ),
      }));
    },

    /**
     * Updates the color of a specific node
     * @param nodeId ID of the node to update
     * @param color New color value
     */
    updateNodeColor: (nodeId: string, color: string) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, color },
            };
          }
          return node;
        }),
      });
    },
  }));
  
  export default useStore;