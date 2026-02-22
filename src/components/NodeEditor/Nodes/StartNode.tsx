import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StartFlowNode } from '../workflow/types';

const StartNode: React.FC<NodeProps<StartFlowNode>> = ({ data }) => {
  return (
    <div className="ne-flow-node ne-start-node-card">
      <div className="ne-start-pill">
        <span className="ne-start-icon" aria-hidden="true">
          {data.icon}
        </span>
        <div>
          <div className="ne-start-title">
            {data.label}
            {typeof data.executionOrder === 'number' ? (
              <span className={`ne-execution-badge ${data.executionState || 'idle'}`}>{data.executionOrder}</span>
            ) : null}
          </div>
          <div className="ne-start-subtitle">{data.subtitle}</div>
        </div>
      </div>
      <Handle id="start-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />
    </div>
  );
};

export default StartNode;
