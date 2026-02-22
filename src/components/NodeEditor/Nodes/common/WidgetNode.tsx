import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WidgetFlowNode } from '../../workflow/types';

const tablePreviewRows = [
  ['Groceries', '$420', 'Needs'],
  ['Rent', '$1,834', 'Needs'],
  ['Travel', '$120', 'Wants'],
];

const WidgetNode: React.FC<NodeProps<WidgetFlowNode>> = ({ data, selected }) => {
  const previewKind = data.previewKind ?? 'operation';
  const isPie = previewKind === 'pie';
  const isTable = previewKind === 'table';
  const isBarV = previewKind === 'barV';
  const isBarH = previewKind === 'barH';
  const isLine = previewKind === 'line';
  const isOperation = previewKind === 'operation';

  return (
    <div className={`ne-flow-node ne-widget-node ${selected ? 'is-selected' : ''}`}>
      <Handle id="widget-in" type="target" position={Position.Left} className="ne-handle" />
      <Handle id="widget-out" type="source" position={Position.Right} className="ne-handle ne-handle-accent" />

      <div className="ne-node-card-shell">
        <div className="ne-node-card-header compact">
          <div
            className="ne-node-icon-bubble ne-icon-circle"
            style={{ background: data.accentColor, color: '#060708', boxShadow: 'none' }}
          >
            {data.icon}
          </div>
          <div className="ne-node-header-copy">
            <div className="ne-node-title-row">
              <div className="ne-node-title">{data.label}</div>
              {typeof data.executionOrder === 'number' ? (
                <span className={`ne-execution-badge ${data.executionState || 'idle'}`}>{data.executionOrder}</span>
              ) : null}
            </div>
            <div className="ne-node-subtitle">{data.subtitle}</div>
          </div>
        </div>

        <div className={`ne-widget-preview ${previewKind}`} data-widget={data.widgetType}>
          {isTable && (
            <>
              <div className="ne-widget-summary-row">
                <span className="ne-mini-label">Rows</span>
                <span className="ne-mini-value">{data.rowCount ?? 0}</span>
                <span className="ne-mini-label">Source</span>
                <span className="ne-mini-value">{data.dataSource ?? 'sample'}</span>
              </div>
              <div className="ne-mini-table">
                <div className="ne-mini-table-head">
                  <span>Name</span>
                  <span>Amount</span>
                  <span>Bucket</span>
                </div>
                {tablePreviewRows.map((row) => (
                  <div className="ne-mini-table-row" key={`${data.widgetType}-${row[0]}`}>
                    <span>{row[0]}</span>
                    <span>{row[1]}</span>
                    <span>{row[2]}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {isPie && (
            <div className="ne-widget-pie-preview" aria-hidden="true">
              <div className="ne-widget-pie-ring" />
              <div className="ne-widget-pie-legend">
                {data.metrics.map((metric) => (
                  <span key={metric} className="ne-metric-pill">{metric}</span>
                ))}
              </div>
            </div>
          )}

          {isBarV && (
            <div className="ne-mini-bars vertical" aria-hidden="true">
              {[42, 70, 55, 30].map((h, idx) => (
                <span key={`${data.widgetType}-${h}-${idx}`} style={{ height: `${h}%`, background: idx % 2 ? '#f59e0b' : '#fb923c' }} />
              ))}
            </div>
          )}

          {isBarH && (
            <div className="ne-mini-bars horizontal" aria-hidden="true">
              {[82, 63, 47, 28].map((w, idx) => (
                <span key={`${data.widgetType}-${w}-${idx}`} style={{ width: `${w}%`, background: idx % 2 ? '#f59e0b' : '#fb923c' }} />
              ))}
            </div>
          )}

          {isLine && (
            <div className="ne-mini-line-chart" aria-hidden="true">
              <svg viewBox="0 0 120 56" className="ne-mini-line-svg">
                <path d="M4 44 L24 36 L42 38 L60 28 L78 32 L96 20 L116 12" />
                <path d="M4 48 L24 42 L42 40 L60 34 L78 36 L96 28 L116 22" className="secondary" />
              </svg>
              <div className="ne-widget-chip-list">
                {data.metrics.map((metric) => (
                  <span key={metric} className="ne-metric-pill">{metric}</span>
                ))}
              </div>
            </div>
          )}

          {isOperation && (
            <div className="ne-operation-preview">
              <div className="ne-operation-line">{data.metrics[0] ?? 'Configure operation'}</div>
              <div className="ne-widget-chip-list">
                {data.metrics.slice(1).map((metric) => (
                  <span key={metric} className="ne-metric-pill">{metric}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetNode;
