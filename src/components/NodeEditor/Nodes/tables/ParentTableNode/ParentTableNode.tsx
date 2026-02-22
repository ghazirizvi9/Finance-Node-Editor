import React, { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ColumnConfig, ParentTableRuntimeFlowNode } from '../../../workflow/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

let localIdCounter = 0;
function localId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${Date.now()}-${localIdCounter}`;
}

function computeTotal(columnId: string, rows: ParentTableRuntimeFlowNode['data']['rows']): string {
  let total = 0;
  let hasNumeric = false;
  for (const row of rows) {
    const raw = row.cells?.[columnId] ?? '';
    const num = parseFloat(raw.replace(/[$,\s%]/g, ''));
    if (!isNaN(num)) {
      total += num;
      hasNumeric = true;
    }
  }
  return hasNumeric ? total.toLocaleString() : '—';
}

// ── Component ─────────────────────────────────────────────────────────────────

const ParentTableNode: React.FC<NodeProps<ParentTableRuntimeFlowNode>> = ({ id, data, selected }) => {
  const [draftRow, setDraftRow] = useState('');

  const columns: ColumnConfig[] = data.columns ?? [];
  const rows = data.rows ?? [];

  const handleAddRow = () => {
    const name = draftRow.trim();
    if (!name || !data.onAddRow) return;
    data.onAddRow(id, name);
    setDraftRow('');
  };

  const handleAddColumn = () => {
    const col: ColumnConfig = {
      id: localId('col'),
      header: 'Column',
      subheader: 'Sub-header',
      headerColor: '#3b82f6',
      subheaderColor: '#93c5fd',
    };
    data.onAddColumn?.(id, col);
  };

  const colCount = columns.length + 2; // row-label col + actions col

  return (
    <div
      className={`ne-flow-node ne-parent-table-node ${selected ? 'is-selected' : ''}`}
      style={{ minWidth: Math.max(480, 200 + columns.length * 160) }}
    >
      <Handle id="table-in" type="target" position={Position.Left} className="ne-handle" />

      <div className="ne-node-card-shell">

        {/* ── Title bar ───────────────────────────────────────────────────── */}
        <div className="ne-node-card-header">
          <div
            className="ne-node-icon-bubble ne-icon-circle"
            style={{ background: data.accentColor, color: '#fff' }}
          >
            {data.icon}
          </div>
          <div className="ne-node-header-copy">
            <div className="ne-node-title-row">
              <span className="ne-node-title">{data.label}</span>
              <span className="ne-node-badge">{rows.length} rows</span>
              {typeof data.executionOrder === 'number' && (
                <span className={`ne-execution-badge ${data.executionState ?? 'idle'}`}>
                  {data.executionOrder}
                </span>
              )}
            </div>
            <div className="ne-node-subtitle">{data.subtitle}</div>
          </div>
        </div>

        {/* ── Spreadsheet ──────────────────────────────────────────────────── */}
        <div className="ne-pt-scroll nodrag nopan">
          <table className="ne-pt-table">
            <thead>

              {/* Column header row */}
              <tr>
                <th className="ne-pt-th ne-pt-row-label-th">Category</th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="ne-pt-th"
                    style={{ background: col.headerColor + '28', borderTop: `3px solid ${col.headerColor}` }}
                  >
                    <div className="ne-pt-header-cell">
                      <input
                        className="ne-pt-col-input nodrag nopan"
                        value={col.header}
                        onChange={(e) => data.onUpdateColumn?.(id, col.id, { header: e.target.value })}
                        aria-label="Column header name"
                      />
                      <div className="ne-pt-col-controls">
                        <label className="ne-pt-color-swatch" title="Header colour">
                          <span style={{ background: col.headerColor }} />
                          <input
                            type="color"
                            className="nodrag nopan"
                            value={col.headerColor}
                            onChange={(e) => data.onUpdateColumn?.(id, col.id, { headerColor: e.target.value })}
                          />
                        </label>
                        <button
                          type="button"
                          className="ne-pt-del-btn nodrag nopan"
                          onClick={() => data.onDeleteColumn?.(id, col.id)}
                          title="Delete column"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="ne-pt-th ne-pt-add-col-th">
                  <button
                    type="button"
                    className="ne-pt-add-col-btn nodrag nopan"
                    onClick={handleAddColumn}
                    title="Add column"
                  >
                    +
                  </button>
                </th>
              </tr>

              {/* Sub-header row */}
              <tr>
                <th className="ne-pt-sub-th ne-pt-row-label-th" />
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="ne-pt-sub-th"
                    style={{ background: col.subheaderColor + '22', borderBottom: `2px solid ${col.subheaderColor}` }}
                  >
                    <div className="ne-pt-header-cell">
                      <input
                        className="ne-pt-col-input nodrag nopan"
                        value={col.subheader}
                        onChange={(e) => data.onUpdateColumn?.(id, col.id, { subheader: e.target.value })}
                        aria-label="Column sub-header"
                      />
                      <label className="ne-pt-color-swatch small" title="Sub-header colour">
                        <span style={{ background: col.subheaderColor }} />
                        <input
                          type="color"
                          className="nodrag nopan"
                          value={col.subheaderColor}
                          onChange={(e) => data.onUpdateColumn?.(id, col.id, { subheaderColor: e.target.value })}
                        />
                      </label>
                    </div>
                  </th>
                ))}
                <th className="ne-pt-sub-th" />
              </tr>

            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="ne-pt-empty" colSpan={colCount}>
                    Add a row below — each row auto-generates a linked child table.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="ne-pt-data-row">
                    {/* Row label cell */}
                    <td className="ne-pt-td ne-pt-row-label-td">
                      <span
                        className="ne-color-dot"
                        style={{ background: row.headerColor }}
                        aria-hidden="true"
                      />
                      <input
                        className="ne-pt-row-name-input nodrag nopan"
                        value={row.name}
                        onChange={(e) => data.onRenameRow?.(id, row.id, e.target.value)}
                        aria-label="Row name"
                      />
                    </td>

                    {/* Data cells */}
                    {columns.map((col) => (
                      <td key={col.id} className="ne-pt-td">
                        <input
                          className="ne-pt-cell-input nodrag nopan"
                          value={row.cells?.[col.id] ?? ''}
                          onChange={(e) => data.onUpdateCell?.(id, row.id, col.id, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                    ))}

                    {/* Row delete */}
                    <td className="ne-pt-td ne-pt-row-actions-td">
                      <button
                        type="button"
                        className="ne-pt-del-btn nodrag nopan"
                        onClick={() => {
                          const ok = window.confirm(`Delete row "${row.name}" and its child table?`);
                          if (ok) data.onDeleteRow?.(id, row.id);
                        }}
                        title="Delete row"
                        aria-label={`Delete ${row.name}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals footer */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="ne-pt-totals-row">
                  <td className="ne-pt-footer-td ne-pt-row-label-td">Totals</td>
                  {columns.map((col) => (
                    <td key={col.id} className="ne-pt-footer-td">
                      {computeTotal(col.id, rows)}
                    </td>
                  ))}
                  <td className="ne-pt-footer-td" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Add row ──────────────────────────────────────────────────────── */}
        <div className="ne-parent-add-row">
          <input
            className="ne-add-row-input nodrag nopan"
            value={draftRow}
            onChange={(e) => setDraftRow(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddRow(); }
            }}
            placeholder="Add row (e.g. Savings, Investments…)"
            aria-label="New row name"
          />
          <button
            type="button"
            className="ne-add-row-btn nodrag nopan"
            onClick={handleAddRow}
          >
            + Add Row
          </button>
        </div>

      </div>

      <Handle id="table-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />
      <Handle id="table-out-bottom" type="source" position={Position.Bottom} className="ne-handle" />
    </div>
  );
};

export default ParentTableNode;
