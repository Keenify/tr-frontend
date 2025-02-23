import { memo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Flow from './MindMap';
import { Session } from '@supabase/supabase-js';

/**
 * Props interface for FlowWrapper component
 */
interface FlowWrapperProps {
  /** Supabase session object containing user authentication details */
  session: Session;
  /** Optional ID of the mindmap to be displayed */
  mindmapId?: string;
}

/**
 * FlowWrapper component that provides ReactFlow context and renders the mindmap
 * This component wraps the main Flow/MindMap component with necessary providers
 * and positioning styles.
 * 
 * @param {FlowWrapperProps} props - Component props
 * @param {Session} props.session - Supabase session for authentication
 * @param {string} [props.mindmapId] - Optional ID of the mindmap to display
 * @returns {JSX.Element} Wrapped Flow component with ReactFlow provider
 */
export const FlowWrapper = memo(({ session, mindmapId }: FlowWrapperProps) => {
  return (
    <div className="absolute inset-0">
      <ReactFlowProvider>
        <Flow session={session} mindmapId={mindmapId} />
      </ReactFlowProvider>
    </div>
  );
});

export default FlowWrapper; 