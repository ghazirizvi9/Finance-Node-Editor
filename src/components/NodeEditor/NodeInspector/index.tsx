import React from 'react';
import type { FinanceFlowNode } from '../workflow/types';

interface NodeInspectorProps {
  selectedNode: FinanceFlowNode;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onUpdateNodeSubtitle: (nodeId: string, subtitle: string) => void;
  onDeleteSelectedNode: () => void;
  onClose?: () => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  onUpdateNodeLabel,
  onUpdateNodeSubtitle,
  onDeleteSelectedNode,
  onClose,
}) => {
  const nodeTypeLabel = selectedNode.type.replace(/([A-Z])/g, ' $1').trim();
  const isChart = selectedNode.type.includes('Chart') || selectedNode.type === 'pieChart' || selectedNode.type === 'trendLine';
  const isOperation = selectedNode.type === 'filter' || selectedNode.type === 'calculate';
  const isParent = selectedNode.type === 'parentTable';
  const isTable = selectedNode.type.includes('Table');

  return (
    <aside className="ne-node-inspector" aria-label="Node configuration panel">
      <div className="ne-inspector-header">
        <div>
          <div className="ne-inspector-eyebrow">Configuration</div>
          <h3>{selectedNode.data.label}</h3>
          <p>{nodeTypeLabel}</p>
        </div>
        <div className="ne-inspector-header-actions">
          <button type="button" className="ne-inspector-delete" onClick={onDeleteSelectedNode}>
            Delete
          </button>
          <button type="button" className="ne-code-close" onClick={onClose} aria-label="Close configuration panel">
            ×
          </button>
        </div>
      </div>

      <div className="ne-inspector-body">
        <section className="ne-inspector-section">
          <div className="ne-inspector-section-title">General</div>
          <label className="ne-inspector-field">
            <span>Node label</span>
            <input
              value={selectedNode.data.label}
              onChange={(event) => onUpdateNodeLabel(selectedNode.id, event.target.value)}
            />
          </label>
          <label className="ne-inspector-field">
            <span>Subtitle</span>
            <input
              value={selectedNode.data.subtitle}
              onChange={(event) => onUpdateNodeSubtitle(selectedNode.id, event.target.value)}
            />
          </label>
        </section>

        <section className="ne-inspector-section">
          <div className="ne-inspector-section-title">Data Source</div>
          <label className="ne-inspector-field">
            <span>Source</span>
            <select defaultValue={String(selectedNode.data.dataSource ?? 'sample-data')}>
              <option value="sample-data">Sample data</option>
              <option value="transactions-csv">CSV / Excel import</option>
              <option value="budget-store">Budget store</option>
              <option value="plaid-api">Plaid API (future)</option>
            </select>
          </label>
          <label className="ne-inspector-field">
            <span>Field mappings</span>
            <textarea rows={3} defaultValue={isTable ? 'amount -> value\ncategory -> label\ndate -> xAxis' : 'value -> metric\ncategory -> group'} />
          </label>
        </section>

        {isChart ? (
          <section className="ne-inspector-section">
            <div className="ne-inspector-section-title">Chart Customization</div>
            <div className="ne-inspector-grid-2">
              <label className="ne-inspector-field">
                <span>Palette</span>
                <select defaultValue="default">
                  <option value="default">Default</option>
                  <option value="cool">Cool</option>
                  <option value="warm">Warm</option>
                </select>
              </label>
              <label className="ne-inspector-field">
                <span>Show labels</span>
                <select defaultValue="yes">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
            <label className="ne-inspector-field">
              <span>Axis / Legend</span>
              <textarea rows={2} defaultValue="X Axis: Month\nY Axis: Amount" />
            </label>
          </section>
        ) : null}

        {isOperation ? (
          <section className="ne-inspector-section">
            <div className="ne-inspector-section-title">Formula / Conditions</div>
            <label className="ne-inspector-field">
              <span>{selectedNode.type === 'calculate' ? 'Formula editor' : 'Filter builder'}</span>
              <textarea
                rows={4}
                defaultValue={
                  selectedNode.type === 'calculate'
                    ? 'Net = Income - Expense\nSavingsRate = Savings / Income'
                    : 'month == currentMonth\nand bucket != "Surplus"'
                }
              />
            </label>
          </section>
        ) : null}

        {isParent ? (
          <section className="ne-inspector-section">
            <div className="ne-inspector-section-title">Parent / Child Relationships</div>
            <div className="ne-inspector-note">
              Parent rows generate linked child tables automatically. Deleting the parent cascades to its child tables.
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
};

export default NodeInspector;
