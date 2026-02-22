import type { Edge, Node } from '@xyflow/react';

export type EditorTheme = 'dark' | 'light';
export type WorkspaceView = 'canvas' | 'workflows';

export type FinanceNodeType =
  | 'start'
  | 'parentTable'
  | 'childTable'
  | 'transactionTable'
  | 'budgetTable'
  | 'verticalBarChart'
  | 'horizontalBarChart'
  | 'pieChart'
  | 'trendLine'
  | 'calculate'
  | 'filter'
  | 'income'
  | 'expense'
  | 'balance';

export type LibraryCategory = 'tables' | 'charts' | 'operations' | 'finance';

export interface ParentTableRow {
  id: string;
  name: string;
  childNodeId: string;
  headerColor: string;
  subheaderColor: string;
}

export interface BaseFinanceNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  description?: string;
  executionOrder?: number;
  executionState?: 'idle' | 'active' | 'done' | 'error';
}

export interface StartNodeData extends BaseFinanceNodeData {
  kind: 'start';
}

export interface ParentTableNodeData extends BaseFinanceNodeData {
  kind: 'parentTable';
  rows: ParentTableRow[];
}

export interface ChildTableNodeData extends BaseFinanceNodeData {
  kind: 'childTable';
  parentNodeId: string;
  rowId: string;
  headerColor: string;
  subheaderColor: string;
  columns: string[];
}

export type FinanceWidgetKind = Exclude<FinanceNodeType, 'start' | 'parentTable' | 'childTable'>;

export interface WidgetNodeData extends BaseFinanceNodeData {
  kind: 'widget';
  widgetType: FinanceWidgetKind;
  category: LibraryCategory;
  metrics: string[];
  previewKind?: 'table' | 'barV' | 'barH' | 'pie' | 'line' | 'operation' | 'finance';
  rowCount?: number;
  dataSource?: string;
}

export type FinanceNodeData =
  | StartNodeData
  | ParentTableNodeData
  | ChildTableNodeData
  | WidgetNodeData;

export type FinanceFlowNode = Node<FinanceNodeData, FinanceNodeType>;
export type StartFlowNode = Node<StartNodeData, 'start'>;
export type ParentTableFlowNode = Node<ParentTableNodeData, 'parentTable'>;
export type ParentTableRuntimeFlowNode = Node<ParentTableNodeRuntimeData, 'parentTable'>;
export type ChildTableFlowNode = Node<ChildTableNodeData, 'childTable'>;
export type WidgetFlowNode = Node<
  WidgetNodeData,
  Exclude<FinanceNodeType, 'start' | 'parentTable' | 'childTable'>
>;

export interface WorkflowGraph {
  nodes: FinanceFlowNode[];
  edges: Edge[];
}

export interface ParentRowRuntimeActions {
  onAddRow: (parentNodeId: string, rowName: string) => void;
  onRenameRow: (parentNodeId: string, rowId: string, nextName: string) => void;
  onDeleteRow: (parentNodeId: string, rowId: string) => void;
}

export type ParentTableNodeRuntimeData = ParentTableNodeData & Partial<ParentRowRuntimeActions>;

export interface WorkflowDirectoryItem {
  id: string;
  name: string;
  description: string;
  updatedLabel: string;
  accentColor: string;
}

export function isParentTableNode(node: FinanceFlowNode): node is FinanceFlowNode & { data: ParentTableNodeData } {
  return node.type === 'parentTable' && node.data.kind === 'parentTable';
}

export function isChildTableNode(node: FinanceFlowNode): node is FinanceFlowNode & { data: ChildTableNodeData } {
  return node.type === 'childTable' && node.data.kind === 'childTable';
}
