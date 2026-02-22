import React from 'react';
import { nodeDefinitions, type NodeDefinition } from './nodeDefinitions';

const categoryOrder: Array<NodeDefinition['category']> = ['tables', 'charts', 'operations'];
const categoryLabels: Record<NodeDefinition['category'], string> = {
  tables: 'Tables',
  charts: 'Charts',
  operations: 'Operations',
};

interface NodeLibraryProps {
  style?: React.CSSProperties;
  onDragHandlePointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onHome?: () => void;
  onToggleCollapsed?: () => void;
  collapsed?: boolean;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({
  style,
  onDragHandlePointerDown,
  onHome,
  onToggleCollapsed,
  collapsed = false,
}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className={`ne-node-library ${collapsed ? 'collapsed' : ''}`} aria-label="Widget library" style={style}>
      <div className="ne-library-header">
        <div className="ne-library-header-row">
          <div
            className="ne-library-title-wrap ne-library-drag-handle"
            onPointerDown={onDragHandlePointerDown}
            title="Drag widget library panel"
          >
            <div className="ne-library-title">Widget Library</div>
            <div className="ne-library-subtitle">Drag widgets onto the canvas</div>
          </div>
          <div className="ne-library-header-actions">
            <button type="button" className="ne-library-header-btn" title="Re-home library panel" aria-label="Re-home library panel" onClick={onHome}>
              ⌂
            </button>
            <button
              type="button"
              className="ne-library-header-btn"
              title={collapsed ? 'Expand widget library' : 'Collapse widget library'}
              aria-label={collapsed ? 'Expand widget library' : 'Collapse widget library'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? '▾' : '▴'}
            </button>
          </div>
        </div>
      </div>

      <div className="ne-library-collapsible">
        <div className="ne-library-sections">
        {categoryOrder.map((category) => {
          const nodes = nodeDefinitions.filter((node) => node.category === category);
          if (!nodes.length) return null;

          return (
            <section className="ne-library-section" key={category}>
              <div className="ne-library-section-title">{categoryLabels[category]}</div>
              <div className="ne-library-list">
                {nodes.map((node) => (
                  <button
                    key={node.type}
                    type="button"
                    className="ne-library-item"
                    draggable
                    onDragStart={(event) => onDragStart(event, node.type)}
                  >
                    <span className={`ne-library-icon ${node.accent}`} aria-hidden="true">
                      {node.icon}
                    </span>
                    <span className="ne-library-item-copy">
                      <span className="ne-library-item-name">{node.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        </div>

      </div>
    </aside>
  );
};

export default NodeLibrary;
