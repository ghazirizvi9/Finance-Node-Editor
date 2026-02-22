import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ChildTableFlowNode } from '../workflow/types';

const sampleRows = [
  ['Housing', '$0', '$0'],
  ['Utilities', '$0', '$0'],
  ['Notes', '-', '-'],
];

const ChildTableNode: React.FC<NodeProps<ChildTableFlowNode>> = ({ data, selected, id }) => {
  return (
    <div className={`ne-flow-node ne-table-node ne-child-table-node ${selected ? 'is-selected' : ''}`}>
      <Handle id="table-in" type="target" position={Position.Left} className="ne-handle" />
      <Handle id="table-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />

      <div className="ne-node-card-shell">
        <div className="ne-node-card-header compact">
          <div className="ne-node-icon-bubble" style={{ background: data.headerColor, color: '#060708', boxShadow: 'none' }}>
            {data.icon}
          </div>
          <div className="ne-node-header-copy">
            <div className="ne-node-title-row">
              <span className="ne-node-title">{data.label}</span>
              {typeof data.executionOrder === 'number' ? (
                <span className={`ne-execution-badge ${data.executionState || 'idle'}`}>{data.executionOrder}</span>
              ) : null}
            </div>
            <div className="ne-node-subtitle">{data.subtitle}</div>
          </div>
        </div>

        <div className="ne-child-table-wrap">
          <div className="ne-child-title-bar" style={{ background: data.headerColor }}>
            <span>{data.label}</span>
            <span className="ne-pill-ghost">Linked</span>
          </div>
          <div className="ne-child-subheader" style={{ background: data.subheaderColor }}>
            <span>Line Item</span>
            {data.columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div className="ne-child-table-body">
            {sampleRows.map((row) => (
              <div className="ne-child-row" key={`${id}-${row[0]}`}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span className="ne-child-row-bubble">0%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildTableNode;
