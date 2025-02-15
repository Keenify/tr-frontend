import { memo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Flow from './MindMap';
import { Session } from '@supabase/supabase-js';

interface FlowWrapperProps {
  session: Session;
  mindmapId?: string;
}

export const FlowWrapper = memo(({ session, mindmapId }: FlowWrapperProps) => {
  return (
    <ReactFlowProvider>
      <Flow session={session} mindmapId={mindmapId} />
    </ReactFlowProvider>
  );
});

export default FlowWrapper; 