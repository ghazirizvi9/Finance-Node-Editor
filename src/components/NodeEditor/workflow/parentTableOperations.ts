import type { Edge } from '@xyflow/react';
import { getChildTableColors } from './colors';
import { cloneWorkflowGraph } from './graphUtils';
import { createChildTableNode } from './factories';
import { isParentTableNode, type WorkflowGraph } from './types';

let rowCounter = 0;

function nextRowId(): string {
  rowCounter += 1;
  return `row-${Date.now()}-${rowCounter}`;
}

function sanitizeRowName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : 'New Child Table';
}

function findParentIndex(graph: WorkflowGraph, parentNodeId: string): number {
  return graph.nodes.findIndex((node) => node.id === parentNodeId && node.type === 'parentTable');
}

function createParentToChildEdge(parentId: string, childId: string): Edge {
  return {
    id: `edge-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    sourceHandle: 'table-out',
    targetHandle: 'table-in',
    type: 'bezier',
  };
}

export function addParentRowAndChildTable(graph: WorkflowGraph, parentNodeId: string, rowNameInput: string): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  const rowName = sanitizeRowName(rowNameInput);
  const childCount = nextGraph.nodes.filter((node) => node.type === 'childTable').length;
  const rowIndex = parentNode.data.rows.length;
  const colors = getChildTableColors(childCount);
  const rowId = nextRowId();

  const childNode = createChildTableNode({
    position: {
      x: parentNode.position.x + 420,
      y: parentNode.position.y + rowIndex * 230,
    },
    label: rowName,
    parentNodeId,
    rowId,
    headerColor: colors.headerColor,
    subheaderColor: colors.subheaderColor,
  });

  parentNode.data.rows = [
    ...parentNode.data.rows,
    {
      id: rowId,
      name: rowName,
      childNodeId: childNode.id,
      headerColor: colors.headerColor,
      subheaderColor: colors.subheaderColor,
    },
  ];

  nextGraph.nodes.push(childNode);
  nextGraph.edges.push(createParentToChildEdge(parentNodeId, childNode.id));

  return nextGraph;
}

export function renameParentRowAndChildTable(
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

  const childIndex = nextGraph.nodes.findIndex((node) => node.id === row.childNodeId && node.type === 'childTable');
  if (childIndex >= 0) {
    const childNode = nextGraph.nodes[childIndex];
    if (childNode.type === 'childTable' && childNode.data.kind === 'childTable') {
      childNode.data.label = normalized;
    }
  }

  return nextGraph;
}

export function deleteParentRowAndChildTable(graph: WorkflowGraph, parentNodeId: string, rowId: string): WorkflowGraph {
  const parentIndex = findParentIndex(graph, parentNodeId);
  if (parentIndex < 0) return graph;

  const nextGraph = cloneWorkflowGraph(graph);
  const parentNode = nextGraph.nodes[parentIndex];
  if (!isParentTableNode(parentNode)) return graph;

  const rowToRemove = parentNode.data.rows.find((row) => row.id === rowId);
  if (!rowToRemove) return graph;

  parentNode.data.rows = parentNode.data.rows.filter((row) => row.id !== rowId);

  nextGraph.nodes = nextGraph.nodes.filter((node) => node.id !== rowToRemove.childNodeId);
  nextGraph.edges = nextGraph.edges.filter(
    (edge) => edge.source !== rowToRemove.childNodeId && edge.target !== rowToRemove.childNodeId
  );

  const siblingChildIds = new Set(parentNode.data.rows.map((row) => row.childNodeId));
  let childOffset = 0;
  nextGraph.nodes = nextGraph.nodes.map((node) => {
    if (siblingChildIds.has(node.id) && node.type === 'childTable') {
      const repositioned = {
        ...node,
        position: {
          x: parentNode.position.x + 420,
          y: parentNode.position.y + childOffset * 230,
        },
      };
      childOffset += 1;
      return repositioned;
    }
    return node;
  });

  return nextGraph;
}
