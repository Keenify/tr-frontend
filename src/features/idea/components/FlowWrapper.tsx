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
    <div className="absolute inset-0">
      <ReactFlowProvider>
        <Flow session={session} mindmapId={mindmapId} />
      </ReactFlowProvider>
    </div>
  );
});

export default FlowWrapper; 