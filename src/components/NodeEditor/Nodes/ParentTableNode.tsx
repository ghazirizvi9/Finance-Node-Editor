import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ParentTableRuntimeFlowNode } from '../workflow/types';

const ParentTableNode: React.FC<NodeProps<ParentTableRuntimeFlowNode>> = ({ id, data, selected }) => {
  const [draftRow, setDraftRow] = useState('');

  const handleAddRow = () => {
    if (!data.onAddRow) return;
    data.onAddRow(id, draftRow);
    setDraftRow('');
  };

  return (
    <div className={`ne-flow-node ne-table-node ne-parent-table-node ${selected ? 'is-selected' : ''}`}>
      <Handle id="table-in" type="target" position={Position.Left} className="ne-handle" />

      <div className="ne-node-card-shell">
        <div className="ne-node-card-header">
          <div className="ne-node-icon-bubble blue">{data.icon}</div>
          <div className="ne-node-header-copy">
            <div className="ne-node-title-row">
              <span className="ne-node-title">{data.label}</span>
              <span className="ne-node-badge">{data.rows.length} rows</span>
              {typeof data.executionOrder === 'number' ? (
                <span className={`ne-execution-badge ${data.executionState || 'idle'}`}>{data.executionOrder}</span>
              ) : null}
            </div>
            <div className="ne-node-subtitle">{data.subtitle}</div>
          </div>
        </div>

        <div className="ne-parent-table-grid">
          <div className="ne-parent-table-head">Category Row</div>
          <div className="ne-parent-table-head">Child Table</div>
          {data.rows.length === 0 ? (
            <div className="ne-parent-empty" role="note">
              Add a row below. Each row creates and links a child table automatically.
            </div>
          ) : (
            data.rows.map((row) => (
              <React.Fragment key={row.id}>
                <div className="ne-parent-row-cell">
                  <span
                    className="ne-color-dot"
                    aria-hidden="true"
                    style={{ background: row.headerColor }}
                  />
                  <input
                    className="ne-parent-row-input nodrag nopan"
                    value={row.name}
                    onChange={(event) => data.onRenameRow?.(id, row.id, event.target.value)}
                    aria-label={`Parent row ${row.name}`}
                  />
                </div>
                <div className="ne-parent-row-link">
                  <span className="ne-link-pill" style={{ borderColor: row.subheaderColor }}>
                    {row.name || 'Child Table'}
                  </span>
                  <button
                    type="button"
                    className="ne-inline-icon-btn nodrag nopan"
                    onClick={() => {
                      const ok = window.confirm(
                        `Delete row "${row.name}" and its generated child table?`
                      );
                      if (ok) data.onDeleteRow?.(id, row.id);
                    }}
                    aria-label={`Delete ${row.name}`}
                    title="Delete row and child table"
                  >
                    x
                  </button>
                </div>
              </React.Fragment>
            ))
          )}
        </div>

        <div className="ne-parent-add-row">
          <input
            className="ne-add-row-input nodrag nopan"
            value={draftRow}
            onChange={(event) => setDraftRow(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddRow();
              }
            }}
            placeholder="Add child table row (e.g. Groceries)"
            aria-label="Add parent table row"
          />
          <button type="button" className="ne-add-row-btn nodrag nopan" onClick={handleAddRow}>
            Add Child Table
          </button>
        </div>
      </div>

      <Handle id="table-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />
      <Handle id="table-out-bottom" type="source" position={Position.Bottom} className="ne-handle" />
    </div>
  );
};

export default ParentTableNode;
