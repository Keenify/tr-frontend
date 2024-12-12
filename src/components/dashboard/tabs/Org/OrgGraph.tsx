import { OrganizationGraph } from '@ant-design/graphs';

interface OrgGraphProps {
  graphData: any;
  nodeConfig: any;
  onGraphReady: (graph: any) => void;
}

export function OrgGraph({ graphData, nodeConfig, onGraphReady }: OrgGraphProps) {
  return (
    <OrganizationGraph 
      data={graphData} 
      style={{ width: '100%', height: '100%' }} 
      nodeCfg={nodeConfig}
      behaviors={['drag-canvas', 'zoom-canvas', 'drag-node']}
      onReady={onGraphReady}
    />
  );
} 