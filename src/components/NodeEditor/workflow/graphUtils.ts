import type { Edge } from '@xyflow/react';
import type { FinanceFlowNode, WorkflowGraph } from './types';

function cloneNode(node: FinanceFlowNode): FinanceFlowNode {
  return {
    ...node,
    position: { ...node.position },
    data: JSON.parse(JSON.stringify(node.data)),
    style: node.style ? { ...node.style } : undefined,
  };
}

function cloneEdge(edge: Edge): Edge {
  return {
    ...edge,
    data: edge.data ? JSON.parse(JSON.stringify(edge.data)) : undefined,
    style: edge.style ? { ...edge.style } : undefined,
    markerEnd: edge.markerEnd,
    markerStart: edge.markerStart,
  };
}

export function cloneWorkflowGraph(graph: WorkflowGraph): WorkflowGraph {
  return {
    nodes: graph.nodes.map(cloneNode),
    edges: graph.edges.map(cloneEdge),
  };
}
