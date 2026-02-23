import type { Edge, Node } from '@xyflow/react';

export type EditorTheme = 'dark' | 'light';
export type WorkspaceView = 'canvas' | 'workflows';

export type FinanceNodeType =
  | 'start'
  | 'parentTable'
  | 'verticalBarChart'
  | 'horizontalBarChart'
  | 'pieChart'
  | 'trendLine'
  | 'calculate'
  | 'filter'
  | 'income'
  | 'expense'
  | 'balance';

export type LibraryCategory = 'tables' | 'charts' | 'operations';

export interface ColumnConfig {
  id: string;
  header: string;
  subheader: string;
  headerColor: string;
  subheaderColor: string;
}

export interface ParentTableRow {
  id: string;
  name: string;
  headerColor: string;
  subheaderColor: string;
  /** Column-keyed cell data */
  cells: Record<string, string>;
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
  columns: ColumnConfig[];
  rows: ParentTableRow[];
}

export type FinanceWidgetKind = Exclude<FinanceNodeType, 'start' | 'parentTable'>;

export interface WidgetNodeData extends BaseFinanceNodeData {
  kind: 'widget';
  widgetType: FinanceWidgetKind;
  category: LibraryCategory;
  metrics: string[];
  previewKind?: 'table' | 'barV' | 'barH' | 'pie' | 'line' | 'operation';
  rowCount?: number;
  dataSource?: string;
}

export type FinanceNodeData =
  | StartNodeData
  | ParentTableNodeData
  | WidgetNodeData;

export type FinanceFlowNode = Node<FinanceNodeData, FinanceNodeType>;
export type StartFlowNode = Node<StartNodeData, 'start'>;
export type ParentTableRuntimeFlowNode = Node<ParentTableNodeRuntimeData, 'parentTable'>;
export type WidgetFlowNode = Node<
  WidgetNodeData,
  Exclude<FinanceNodeType, 'start' | 'parentTable'>
>;

export interface WorkflowGraph {
  nodes: FinanceFlowNode[];
  edges: Edge[];
}

export interface ParentRowRuntimeActions {
  onAddRow: (parentNodeId: string, rowName: string) => void;
  onRenameRow: (parentNodeId: string, rowId: string, nextName: string) => void;
  onDeleteRow: (parentNodeId: string, rowId: string) => void;
  onUpdateCell: (parentNodeId: string, rowId: string, columnId: string, value: string) => void;
  onAddColumn: (parentNodeId: string, column: ColumnConfig) => void;
  onUpdateColumn: (parentNodeId: string, columnId: string, updates: Partial<ColumnConfig>) => void;
  onDeleteColumn: (parentNodeId: string, columnId: string) => void;
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


