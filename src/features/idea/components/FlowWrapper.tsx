import { memo } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Flow from './MindMap';

export const FlowWrapper = memo(() => {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
});

export default FlowWrapper; 