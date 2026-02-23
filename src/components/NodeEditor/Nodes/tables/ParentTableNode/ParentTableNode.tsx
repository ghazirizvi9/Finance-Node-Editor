import React from 'react';
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
  const columns: ColumnConfig[] = data.columns ?? [];
  const rows = data.rows ?? [];

  const handleAddRow = () => {
    data.onAddRow?.(id, 'New Row');
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

  const colCount = columns.length + 1; // data cols + actions col

  return (
    <div
      className={`ne-flow-node ne-parent-table-node ${selected ? 'is-selected' : ''}`}
      style={{ minWidth: Math.max(480, 200 + columns.length * 160) }}
    >
      <Handle id="table-in" type="target" position={Position.Left} className="ne-handle" />

      <div className="ne-node-card-shell">

        {/* ── Table title (drag handle) ─────────────────────────────────── */}
        <div className="ne-pt-title-row" style={{ borderTop: `3px solid ${data.accentColor ?? '#3b82f6'}` }}>
          <span className="ne-pt-title-icon" style={{ background: data.accentColor ?? '#3b82f6' }}>
            {data.icon}
          </span>
          <span className="ne-pt-title-label">{data.label}</span>
          <span className="ne-pt-title-badge">{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span>
        </div>

        {/* ── Spreadsheet ──────────────────────────────────────────────────── */}
        <div className="ne-pt-scroll nodrag nopan">
          <table className="ne-pt-table">
            <thead>

              {/* Column header row */}
              <tr>
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

            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="ne-pt-empty" colSpan={colCount}>
                    No rows yet — click + Add Row to get started.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="ne-pt-data-row">
                    {/* Data cells */}
                    {columns.map((col, colIdx) => (
                      <td key={col.id} className="ne-pt-td">
                        {colIdx === 0 ? (
                          <input
                            className="ne-pt-row-name-input nodrag nopan"
                            value={row.cells?.[col.id] ?? ''}
                            onChange={(e) => data.onUpdateCell?.(id, row.id, col.id, e.target.value)}
                            placeholder={row.name || '—'}
                          />
                        ) : (
                          <input
                            className="ne-pt-cell-input nodrag nopan"
                            value={row.cells?.[col.id] ?? ''}
                            onChange={(e) => data.onUpdateCell?.(id, row.id, col.id, e.target.value)}
                            placeholder="—"
                          />
                        )}
                      </td>
                    ))}

                    {/* Row delete */}
                    <td className="ne-pt-td ne-pt-row-actions-td">
                      <button
                        type="button"
                        className="ne-pt-del-btn nodrag nopan"
                        onClick={() => data.onDeleteRow?.(id, row.id)}
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

            {/* Footer with add-row button then totals */}
            <tfoot>
              <tr className="ne-pt-data-row">
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="ne-pt-td" />
                ))}
                <td className="ne-pt-td ne-pt-add-row-cell">
                  <button
                    type="button"
                    className="ne-pt-add-col-btn nodrag nopan"
                    onClick={handleAddRow}
                    title="Add row"
                  >
                    +
                  </button>
                </td>
              </tr>
              {rows.length > 0 && (
                <tr className="ne-pt-totals-row">
                  {columns.map((col, colIdx) => (
                    <td key={col.id} className="ne-pt-footer-td">
                      {colIdx === 0 ? 'Totals' : computeTotal(col.id, rows)}
                    </td>
                  ))}
                  <td className="ne-pt-footer-td" />
                </tr>
              )}
            </tfoot>
          </table>
        </div>

      </div>

      <Handle id="table-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />
      <Handle id="table-out-bottom" type="source" position={Position.Bottom} className="ne-handle" />
    </div>
  );
};

export default ParentTableNode;
