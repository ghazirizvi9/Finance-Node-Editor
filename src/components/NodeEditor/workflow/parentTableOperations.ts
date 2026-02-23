import { getRowColors } from './colors';
import { cloneWorkflowGraph } from './graphUtils';
import { isParentTableNode, type ColumnConfig, type WorkflowGraph } from './types';

let rowCounter = 0;

function nextRowId(): string {
  rowCounter += 1;
  return `row-${Date.now()}-${rowCounter}`;
}

function sanitizeRowName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : 'New Row';
}

function findParentIndex(graph: WorkflowGraph, parentNodeId: string): number {
  return graph.nodes.findIndex((node) => node.id === parentNodeId && node.type === 'parentTable');
}

export function addParentRow(graph: WorkflowGraph, parentNodeId: string, rowNameInput: string): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  const rowName = sanitizeRowName(rowNameInput);
  const colorIndex = parentNode.data.rows.length;
  const colors = getRowColors(colorIndex);
  const rowId = nextRowId();

  parentNode.data.rows = [
    ...parentNode.data.rows,
    {
      id: rowId,
      name: rowName,
      headerColor: colors.headerColor,
      subheaderColor: colors.subheaderColor,
      cells: {},
    },
  ];

  return nextGraph;
}

export function renameParentRow(
  graph: WorkflowGraph,
  parentNodeId: string,
  rowId: string,
  nextNameInput: string
): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const normalized = sanitizeRowName(nextNameInput);
  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  const row = parentNode.data.rows.find((item) => item.id === rowId);
  if (!row) return graph;
  row.name = normalized;

  return nextGraph;
}

export function deleteParentRow(graph: WorkflowGraph, parentNodeId: string, rowId: string): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  parentNode.data.rows = parentNode.data.rows.filter((row) => row.id !== rowId);

  return nextGraph;
}

// ─── Cell operations ──────────────────────────────────────────────────────────

export function updateParentTableCell(
  graph: WorkflowGraph,
  parentNodeId: string,
  rowId: string,
  columnId: string,
  value: string
): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  const row = parentNode.data.rows.find((r) => r.id === rowId);
  if (!row) return graph;

  row.cells = { ...row.cells, [columnId]: value };
  return nextGraph;
}

// ─── Column operations ────────────────────────────────────────────────────────

export function addParentTableColumn(
  graph: WorkflowGraph,
  parentNodeId: string,
  column: ColumnConfig
): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  parentNode.data.columns = [...parentNode.data.columns, column];
  parentNode.data.rows = parentNode.data.rows.map((row) => ({
    ...row,
    cells: { ...row.cells, [column.id]: '' },
  }));

  return nextGraph;
}

export function updateParentTableColumn(
  graph: WorkflowGraph,
  parentNodeId: string,
  columnId: string,
  updates: Partial<ColumnConfig>
): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  parentNode.data.columns = parentNode.data.columns.map((col) =>
    col.id === columnId ? { ...col, ...updates } : col
  );

  return nextGraph;
}

export function deleteParentTableColumn(
  graph: WorkflowGraph,
  parentNodeId: string,
  columnId: string
): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  parentNode.data.columns = parentNode.data.columns.filter((col) => col.id !== columnId);
  parentNode.data.rows = parentNode.data.rows.map((row) => {
    const cells = { ...row.cells };
    delete cells[columnId];
    return { ...row, cells };
  });

  return nextGraph;
}
