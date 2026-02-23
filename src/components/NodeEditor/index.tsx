import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BottomToolbar from './BottomToolbar';
import NodeInspector from './NodeInspector';
import NodeLibrary from './NodeLibrary';
import TopBar from './TopBar';
import { useCanvasInteractions, type CanvasContextMenuState } from './mouseClicks/useCanvasInteractions';

// Node components - organized by category
import StartNode from './Nodes/StartNode/StartNode';
// Tables
import ParentTableNode from './Nodes/tables/ParentTableNode/ParentTableNode';
// Charts
import VerticalBarChartNode from './Nodes/charts/VerticalBarChart';
import HorizontalBarChartNode from './Nodes/charts/HorizontalBarChart';
import PieChartNode from './Nodes/charts/PieChart';
import TrendLineNode from './Nodes/charts/TrendLine';
// Operations
import CalculateNode from './Nodes/operations/Calculate';
import FilterNode from './Nodes/operations/Filter';
import IncomeNode from './Nodes/operations/Income';
import ExpenseNode from './Nodes/operations/Expense';
import BalanceNode from './Nodes/operations/Balance';
import './NodeEditor.css';
import { cloneWorkflowGraph } from './workflow/graphUtils';
import { createEmptyWorkflowGraph } from './workflow/factories';
import {
  addParentRow,
  deleteParentRow,
  renameParentRow,
  updateParentTableCell,
  addParentTableColumn,
  updateParentTableColumn,
  deleteParentTableColumn,
} from './workflow/parentTableOperations';
import { workflowDirectoryItems } from './workflow/templates';
import type {
  EditorTheme,
  FinanceFlowNode,
  ParentTableNodeRuntimeData,
  WorkspaceView,
  WorkflowGraph,
} from './workflow/types';

const nodeTypes = {
  start: StartNode,
  parentTable: ParentTableNode,
  verticalBarChart: VerticalBarChartNode,
  horizontalBarChart: HorizontalBarChartNode,
  pieChart: PieChartNode,
  trendLine: TrendLineNode,
  calculate: CalculateNode,
  filter: FilterNode,
  income: IncomeNode,
  expense: ExpenseNode,
  balance: BalanceNode,
};

const HISTORY_LIMIT = 80;
const WORKFLOW_STORAGE_KEY = 'node-editor-app.workflows.v1';

function trimHistory(history: WorkflowGraph[]): WorkflowGraph[] {
  return history.length > HISTORY_LIMIT ? history.slice(history.length - HISTORY_LIMIT) : history;
}

function computeExecutionOrder(graph: WorkflowGraph): Map<string, number> {
  const order = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const inboundCounts = new Map<string, number>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
    inboundCounts.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    const list = adjacency.get(edge.source);
    if (list) list.push(edge.target);
    inboundCounts.set(edge.target, (inboundCounts.get(edge.target) ?? 0) + 1);
  }

  const queue = graph.nodes
    .filter((node) => (inboundCounts.get(node.id) ?? 0) === 0)
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
    .map((node) => node.id);

  let current = 1;
  const visited = new Set<string>();

  while (queue.length) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) continue;
    visited.add(nodeId);
    order.set(nodeId, current++);

    for (const targetId of adjacency.get(nodeId) ?? []) {
      const nextInbound = (inboundCounts.get(targetId) ?? 1) - 1;
      inboundCounts.set(targetId, nextInbound);
      if (nextInbound <= 0) queue.push(targetId);
    }
  }

  for (const node of graph.nodes) {
    if (!order.has(node.id)) order.set(node.id, current++);
  }

  return order;
}

interface ClipboardPayload {
  nodes: FinanceFlowNode[];
  edges: Edge[];
  origin: { x: number; y: number };
}

interface PersistedWorkflowStore {
  version: 1;
  activeWorkflowName: string;
  workflows: Record<string, WorkflowGraph>;
}

function normalizeWorkflowName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length ? trimmed : 'Untitled Workflow';
}

function readPersistedWorkflowStore(): PersistedWorkflowStore | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWorkflowStore>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== 1 || typeof parsed.workflows !== 'object' || !parsed.workflows) return null;
    return {
      version: 1,
      activeWorkflowName:
        typeof parsed.activeWorkflowName === 'string' ? parsed.activeWorkflowName : 'My Workflow',
      workflows: parsed.workflows as Record<string, WorkflowGraph>,
    };
  } catch {
    return null;
  }
}

function writePersistedWorkflowStore(store: PersistedWorkflowStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore localStorage write failures (private mode / quota / disabled storage).
  }
}

function loadSavedWorkflowGraph(workflowName: string): WorkflowGraph | null {
  const store = readPersistedWorkflowStore();
  if (!store) return null;
  const key = normalizeWorkflowName(workflowName);
  const saved = store.workflows[key];
  if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) return null;
  return cloneWorkflowGraph(saved);
}

function saveWorkflowGraph(workflowName: string, graph: WorkflowGraph): void {
  const key = normalizeWorkflowName(workflowName);
  const previous = readPersistedWorkflowStore();
  const next: PersistedWorkflowStore = {
    version: 1,
    activeWorkflowName: key,
    workflows: {
      ...(previous?.workflows ?? {}),
      [key]: cloneWorkflowGraph(graph),
    },
  };
  writePersistedWorkflowStore(next);
}

function getInitialWorkflowState(): { projectName: string; graph: WorkflowGraph } | null {
  const store = readPersistedWorkflowStore();
  if (!store) return null;
  const saved = store.workflows[store.activeWorkflowName];
  if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) return null;
  return {
    projectName: store.activeWorkflowName,
    graph: cloneWorkflowGraph(saved),
  };
}

const NodeEditor: React.FC = () => {
  const initialWorkflowStateRef = useRef<{ projectName: string; graph: WorkflowGraph } | null>(null);
  if (initialWorkflowStateRef.current === null) {
    initialWorkflowStateRef.current = getInitialWorkflowState();
  }

  const [graph, setGraph] = useState<WorkflowGraph>(
    () => initialWorkflowStateRef.current?.graph ?? createEmptyWorkflowGraph()
  );
  const [historyPast, setHistoryPast] = useState<WorkflowGraph[]>([]);
  const [historyFuture, setHistoryFuture] = useState<WorkflowGraph[]>([]);
  const [projectName, setProjectName] = useState(
    () => initialWorkflowStateRef.current?.projectName ?? 'My Workflow'
  );
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('canvas');
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('dark');
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [showInspectorPanel, setShowInspectorPanel] = useState(false);
  const [clipboard, setClipboard] = useState<ClipboardPayload | null>(null);

  const evaluateTimerRef = useRef<number | null>(null);
  const pasteCountRef = useRef(0);

  const commitGraph = (updater: (current: WorkflowGraph) => WorkflowGraph) => {
    setGraph((current) => {
      const nextGraph = updater(current);
      if (nextGraph === current) return current;
      setHistoryPast((previous) => trimHistory([...previous, cloneWorkflowGraph(current)]));
      setHistoryFuture([]);
      return nextGraph;
    });
  };

  // ── All mouse / pointer / click / zoom / pan / drag handlers ──
  const {
    isTwoButtonPanning,
    viewportZoom,
    contextMenu,
    setContextMenu,
    libraryPosition,
    setLibraryPosition,
    canvasShellRef,
    blockNonLeftSelectionPointerDown,
    handleCanvasMouseDownCapture,
    onDragOver,
    onDrop,
    onNodeDragStart,
    onNodeDragStop,
    onMove,
    onPaneClick,
    onNodeClick,
    onNodeDoubleClick,
    onDoubleClick,
    onPaneContextMenu,
    onNodeContextMenu,
    handleLibraryDragHandlePointerDown,
    openCanvasContextMenu,
  } = useCanvasInteractions({
    reactFlowInstance,
    graph,
    setGraph,
    commitGraph,
    setShowInspectorPanel,
    pushDragToHistory: (snapshot) => {
      setHistoryPast((previous) => trimHistory([...previous, snapshot]));
      setHistoryFuture([]);
    },
  });

  useEffect(() => {
    return () => {
      if (evaluateTimerRef.current) {
        window.clearTimeout(evaluateTimerRef.current);
      }
    };
  }, []);

  const executionOrder = useMemo(() => (isEvaluating ? computeExecutionOrder(graph) : new Map<string, number>()), [graph, isEvaluating]);

  const hydratedNodes: FinanceFlowNode[] = graph.nodes.map((node) => {
    const executionOrderValue = executionOrder.get(node.id);
    const enrichedData = {
      ...node.data,
      executionOrder: executionOrderValue,
      executionState: executionOrderValue ? 'active' : 'idle',
    } as FinanceFlowNode['data'];

    if (node.type !== 'parentTable' || node.data.kind !== 'parentTable') {
      return {
        ...node,
        data: enrichedData,
      };
    }

    const runtimeData: ParentTableNodeRuntimeData = {
      ...(enrichedData as ParentTableNodeRuntimeData),
      onAddRow: (parentNodeId, rowName) => {
        commitGraph((current) => addParentRow(current, parentNodeId, rowName));
      },
      onRenameRow: (parentNodeId, rowId, nextName) => {
        setGraph((current) => renameParentRow(current, parentNodeId, rowId, nextName));
      },
      onDeleteRow: (parentNodeId, rowId) => {
        commitGraph((current) => deleteParentRow(current, parentNodeId, rowId));
      },
      onUpdateCell: (parentNodeId, rowId, columnId, value) => {
        setGraph((current) => updateParentTableCell(current, parentNodeId, rowId, columnId, value));
      },
      onAddColumn: (parentNodeId, column) => {
        setGraph((current) => addParentTableColumn(current, parentNodeId, column));
      },
      onUpdateColumn: (parentNodeId, columnId, updates) => {
        setGraph((current) => updateParentTableColumn(current, parentNodeId, columnId, updates));
      },
      onDeleteColumn: (parentNodeId, columnId) => {
        commitGraph((current) => deleteParentTableColumn(current, parentNodeId, columnId));
      },
    };

    return {
      ...node,
      data: runtimeData,
    };
  });

  const displayEdges: Edge[] = graph.edges.map((edge, index) => ({
    ...edge,
    type: 'bezier',
    animated: isEvaluating || Boolean(edge.animated),
    style: {
      ...(edge.style ?? {}),
      stroke: isEvaluating ? '#2f7dff' : '#5b6576',
      strokeWidth: isEvaluating ? 2.4 : 2,
      opacity: isEvaluating ? 0.95 : 0.9,
    },
    zIndex: isEvaluating ? 2 + index : edge.zIndex,
  }));

  const onNodesChange = (changes: NodeChange<Node>[]) => {
    setGraph((current) => ({
      ...current,
      nodes: applyNodeChanges(changes, current.nodes) as FinanceFlowNode[],
    }));
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    setGraph((current) => ({
      ...current,
      edges: applyEdgeChanges(changes, current.edges),
    }));
  };

  const onConnect = (connection: Connection) => {
    commitGraph((current) => ({
      ...current,
      edges: addEdge(
        {
          ...connection,
          type: 'bezier',
          animated: true,
        },
        current.edges
      ),
    }));
  };

  const handleUndo = () => {
    if (!historyPast.length) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((items) => items.slice(0, -1));
    setHistoryFuture((items) => [cloneWorkflowGraph(graph), ...items].slice(0, HISTORY_LIMIT));
    setGraph(cloneWorkflowGraph(previous));
  };

  const handleRedo = () => {
    if (!historyFuture.length) return;
    const [next, ...rest] = historyFuture;
    setHistoryFuture(rest);
    setHistoryPast((items) => trimHistory([...items, cloneWorkflowGraph(graph)]));
    setGraph(cloneWorkflowGraph(next));
  };

  const handleEvaluate = () => {
    if (isEvaluating) {
      setIsEvaluating(false);
      if (evaluateTimerRef.current) {
        window.clearTimeout(evaluateTimerRef.current);
        evaluateTimerRef.current = null;
      }
    } else {
      setIsEvaluating(true);
      if (evaluateTimerRef.current) {
        window.clearTimeout(evaluateTimerRef.current);
      }
      evaluateTimerRef.current = window.setTimeout(() => setIsEvaluating(false), 2200);
    }
  };

  const handlePublish = () => {
    saveWorkflowGraph(projectName, graph);
  };

  const buildClipboardPayloadFromSelection = (): ClipboardPayload | null => {
    const selectedNodeIds = new Set(
      graph.nodes.filter((node) => node.selected && node.type !== 'start').map((node) => node.id)
    );

    if (!selectedNodeIds.size) return null;

    const nodes = graph.nodes.filter((node) => selectedNodeIds.has(node.id));
    if (!nodes.length) return null;

    const edges = graph.edges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    const cloned = cloneWorkflowGraph({ nodes, edges });
    const origin = cloned.nodes.reduce(
      (acc, node) => ({
        x: Math.min(acc.x, node.position.x),
        y: Math.min(acc.y, node.position.y),
      }),
      { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }
    );

    return {
      ...cloned,
      origin: {
        x: Number.isFinite(origin.x) ? origin.x : 0,
        y: Number.isFinite(origin.y) ? origin.y : 0,
      },
    };
  };

  const copySelectedNodes = () => {
    const payload = buildClipboardPayloadFromSelection();
    if (!payload) return;
    setClipboard(payload);
    pasteCountRef.current = 0;
    setContextMenu(null);
  };

  const pasteClipboardNodes = (target?: { x: number; y: number }) => {
    if (!clipboard) return;
    pasteCountRef.current += 1;

    commitGraph((current) => {
      const idMap = new Map<string, string>();
      const rowIdMap = new Map<string, string>();
      const pasteOffset =
        target ??
        ({
          x: clipboard.origin.x + 32 + pasteCountRef.current * 12,
          y: clipboard.origin.y + 32 + pasteCountRef.current * 12,
        } as const);

      const deltaX = pasteOffset.x - clipboard.origin.x;
      const deltaY = pasteOffset.y - clipboard.origin.y;

      const deselectedCurrentNodes = current.nodes.map((node) => ({ ...node, selected: false })) as FinanceFlowNode[];
      const deselectedCurrentEdges = current.edges.map((edge) => ({ ...edge, selected: false }));

      const firstPassNodes = clipboard.nodes.map((node) => {
        const cloneId = `${node.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        idMap.set(node.id, cloneId);
        return {
          ...node,
          id: cloneId,
          selected: true,
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          },
        } as FinanceFlowNode;
      });

      const remappedNodes = firstPassNodes.map((node) => {
        if (node.type === 'parentTable' && node.data.kind === 'parentTable') {
          const rows = node.data.rows.map((row) => {
            const newRowId = `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            rowIdMap.set(row.id, newRowId);
            return {
              ...row,
              id: newRowId,
            };
          });
          return {
            ...node,
            data: {
              ...node.data,
              rows,
            },
          } as FinanceFlowNode;
        }

        return node;
      });

      const remappedEdges = clipboard.edges
        .map((edge) => {
          const source = idMap.get(edge.source);
          const targetId = idMap.get(edge.target);
          if (!source || !targetId) return null;
          return {
            ...edge,
            id: `edge-${source}-${targetId}-${Math.random().toString(36).slice(2, 6)}`,
            source,
            target: targetId,
            selected: true,
          } as Edge;
        })
        .filter(Boolean) as Edge[];

      return {
        ...current,
        nodes: [...deselectedCurrentNodes, ...remappedNodes],
        edges: [...deselectedCurrentEdges, ...remappedEdges],
      };
    });

    setContextMenu(null);
  };

  const deleteSelectedElements = () => {
    const selectedNodeIds = new Set(
      graph.nodes.filter((node) => node.selected && node.type !== 'start').map((node) => node.id)
    );
    const selectedEdgeIds = new Set(graph.edges.filter((edge) => edge.selected).map((edge) => edge.id));

    if (!selectedNodeIds.size && !selectedEdgeIds.size) return;

    const includesParent = graph.nodes.some(
      (node) => selectedNodeIds.has(node.id) && node.type === 'parentTable'
    );

    if (includesParent) {
      const ok = window.confirm(
        'Delete selected parent table? All row data will be lost.'
      );
      if (!ok) return;
    }

    commitGraph((current) => {
      const allRemovedNodeIds = new Set<string>([...selectedNodeIds]);

      const remainingNodes = current.nodes
        .filter((node) => !allRemovedNodeIds.has(node.id))
        .map((node) => node) as FinanceFlowNode[];

      const remainingEdges = current.edges.filter(
        (edge) =>
          !selectedEdgeIds.has(edge.id) &&
          !allRemovedNodeIds.has(edge.source) &&
          !allRemovedNodeIds.has(edge.target)
      );

      return {
        ...current,
        nodes: remainingNodes,
        edges: remainingEdges,
      };
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (meta && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if (meta && key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (meta && key === 's') {
        event.preventDefault();
        handlePublish();
        return;
      }

      if (isTextInput) return;

      if (meta && key === 'c') {
        event.preventDefault();
        copySelectedNodes();
        return;
      }

      if (meta && key === 'v') {
        event.preventDefault();
        pasteClipboardNodes();
        return;
      }

      if (event.key === 'Escape') {
        setContextMenu(null);
        setShowCodePanel(false);
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedElements();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [graph, historyFuture.length, historyPast.length, clipboard, projectName]);

  const openWorkflowCanvas = (workflowName: string, useBlank = false) => {
    const normalizedName = normalizeWorkflowName(workflowName);
    const savedGraph = useBlank ? null : loadSavedWorkflowGraph(normalizedName);

    setProjectName(normalizedName);
    setGraph(savedGraph ?? createEmptyWorkflowGraph());
    setHistoryPast([]);
    setHistoryFuture([]);
    setShowCodePanel(false);
    setLibraryCollapsed(false);
    setShowInspectorPanel(false);
    setContextMenu(null);
    setLibraryPosition({ x: 18, y: 18 });
    setIsEvaluating(false);
    setWorkspaceView('canvas');
  };

  const selectedNodes = graph.nodes.filter((node) => node.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const zoomLabel = `${Math.round(viewportZoom * 100)}%`;

  useEffect(() => {
    if (!selectedNode) {
      setShowInspectorPanel(false);
    }
  }, [selectedNode]);

  const codeSnapshot = useMemo(
    () => ({
      workflow: projectName,
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        label: String(node.data.label ?? ''),
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      })),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    }),
    [graph, projectName]
  );

  return (
    <div className={`node-editor theme-${editorTheme} ${isEvaluating ? 'is-evaluating' : ''}`} data-theme={editorTheme}>
      {workspaceView === 'workflows' ? (
        <div className="ne-workflow-directory">
          <div className="ne-directory-header">
            <div>
              <div className="ne-directory-eyebrow">Node Editor Studio</div>
              <h1>Workflow Templates</h1>
              <p>Start from a template or build a custom workflow with tables, charts, and operations.</p>
            </div>
            <div className="ne-directory-actions">
              <button type="button" className="ne-action-btn" onClick={() => openWorkflowCanvas('My Workflow', true)}>
                New Workflow
              </button>
            </div>
          </div>

          <div className="ne-directory-grid">
            {workflowDirectoryItems.map((item) => (
              <button key={item.id} type="button" className="ne-directory-card" onClick={() => openWorkflowCanvas(item.name)}>
                <span className="ne-directory-card-glow" style={{ background: item.accentColor }} />
                <span className="ne-directory-card-top">
                  <span className="ne-directory-card-dot" style={{ background: item.accentColor }} />
                  <span className="ne-directory-card-updated">{item.updatedLabel}</span>
                </span>
                <span className="ne-directory-card-title">{item.name}</span>
                <span className="ne-directory-card-description">{item.description}</span>
                <span className="ne-directory-card-cta">Open template canvas</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <TopBar
            projectName={projectName}
            onProjectNameChange={(name) => setProjectName(name || 'Untitled Workflow')}
            onEvaluate={handleEvaluate}
            onPublish={handlePublish}
            isEvaluating={isEvaluating}
            onToggleCodePanel={() => setShowCodePanel((value) => !value)}
            codePanelOpen={showCodePanel}
          />

          <div className="node-editor-body">
            <div
              className="ne-canvas-shell"
              ref={canvasShellRef}
              onPointerDownCapture={blockNonLeftSelectionPointerDown}
              onMouseDownCapture={handleCanvasMouseDownCapture}
              onContextMenu={(event) => {
                const target = event.target as HTMLElement | null;
                if (!target) return;
                if (!target.closest('.react-flow')) return;
                event.preventDefault();
              }}
            >
              <ReactFlow
                nodes={hydratedNodes}
                edges={displayEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onInit={setReactFlowInstance}
                onNodeDragStart={onNodeDragStart}
                onNodeDragStop={onNodeDragStop}
                onMove={onMove}
                onPaneClick={onPaneClick}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onDoubleClick={onDoubleClick}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                nodeTypes={nodeTypes}
                snapToGrid
                snapGrid={[16, 16]}
                connectionLineType={ConnectionLineType.Bezier}
                defaultEdgeOptions={{
                  type: 'bezier',
                  animated: true,
                  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#5b6576' },
                }}
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll
                selectionOnDrag={!isTwoButtonPanning}
                elementsSelectable={!isTwoButtonPanning}
                nodesDraggable={!isTwoButtonPanning}
                nodesConnectable={!isTwoButtonPanning}
                multiSelectionKeyCode="Shift"
                deleteKeyCode={null}
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1.8}
                  color={editorTheme === 'dark' ? '#363a42' : '#c0cad9'}
                />
                <MiniMap
                  pannable
                  zoomable
                  position="bottom-right"
                  className="ne-minimap"
                  nodeColor={(node) => {
                    const data = node.data as Record<string, unknown>;
                    const accent = typeof data.accentColor === 'string' ? data.accentColor : '#64748b';
                    return accent;
                  }}
                  maskColor={editorTheme === 'dark' ? 'rgba(3,4,6,0.72)' : 'rgba(255,255,255,0.72)'}
                />
              </ReactFlow>

              {showInspectorPanel && selectedNode ? (
                <NodeInspector
                  selectedNode={selectedNode}
                  onUpdateNodeLabel={(nodeId, label) => {
                    setGraph((current) => ({
                      ...current,
                      nodes: current.nodes.map((node) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
                      ),
                    }));
                  }}
                  onUpdateNodeSubtitle={(nodeId, subtitle) => {
                    setGraph((current) => ({
                      ...current,
                      nodes: current.nodes.map((node) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, subtitle } } : node
                      ),
                    }));
                  }}
                  onDeleteSelectedNode={deleteSelectedElements}
                  onClose={() => setShowInspectorPanel(false)}
                />
              ) : null}

              <NodeLibrary
                style={{
                  left: `${libraryPosition.x}px`,
                  top: `${libraryPosition.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                }}
                onDragHandlePointerDown={handleLibraryDragHandlePointerDown}
                onHome={() => {
                  setLibraryPosition({ x: 18, y: 18 });
                }}
                onToggleCollapsed={() => setLibraryCollapsed((value) => !value)}
                collapsed={libraryCollapsed}
              />

              {showCodePanel ? (
                <aside className={`ne-code-panel ${showInspectorPanel ? 'with-inspector' : 'solo'}`} aria-label="Workflow code panel">
                  <div className="ne-code-panel-header">
                    <span>Workflow JSON</span>
                    <button type="button" className="ne-code-close" onClick={() => setShowCodePanel(false)}>
                      ×
                    </button>
                  </div>
                  <pre>{JSON.stringify(codeSnapshot, null, 2)}</pre>
                </aside>
              ) : null}

              {contextMenu ? (
                <div
                  className="ne-canvas-context-menu"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <button type="button" onClick={copySelectedNodes} disabled={!graph.nodes.some((n) => n.selected && n.type !== 'start')}>
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => pasteClipboardNodes({ x: contextMenu.flowX, y: contextMenu.flowY })}
                    disabled={!clipboard}
                  >
                    Paste
                  </button>
                  <button type="button" onClick={deleteSelectedElements} disabled={!graph.nodes.some((n) => n.selected && n.type !== 'start')}>
                    Delete
                  </button>
                </div>
              ) : null}

              <div className={`ne-preview-toast ${isEvaluating ? 'is-visible' : ''}`} aria-live="polite">
                <span className="ne-preview-toast-spinner" aria-hidden="true">↻</span>
                <span>
                  {isEvaluating
                    ? 'Evaluating workflow: data is flowing through connections'
                    : 'Left-drag to box-select • Right-click for copy / paste • Hold left + right mouse to pan'}
                </span>
              </div>

              <BottomToolbar
                canUndo={historyPast.length > 0}
                canRedo={historyFuture.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onZoomOut={() => reactFlowInstance?.zoomOut({ duration: 140 })}
                onZoomIn={() => reactFlowInstance?.zoomIn({ duration: 140 })}
                onFitView={() => reactFlowInstance?.fitView({ duration: 180, padding: 0.2 })}
                onResetZoom={() => {
                  const vp = reactFlowInstance?.getViewport();
                  if (vp) reactFlowInstance?.setViewport({ ...vp, zoom: 1 }, { duration: 180 });
                }}
                zoomLabel={zoomLabel}
                theme={editorTheme}
                onToggleTheme={() => setEditorTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeEditor;
