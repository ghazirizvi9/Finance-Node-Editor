import type { XYPosition } from '@xyflow/react';
import type {
  ChildTableNodeData,
  FinanceFlowNode,
  FinanceNodeType,
  FinanceWidgetKind,
  ParentTableNodeData,
  WidgetNodeData,
  WorkflowGraph,
} from './types';

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function baseNode<TType extends FinanceNodeType, TData extends FinanceFlowNode['data']>(
  id: string,
  type: TType,
  position: XYPosition,
  data: TData,
  extras?: Partial<FinanceFlowNode>
): FinanceFlowNode {
  return {
    id,
    type,
    position,
    data,
    ...extras,
  } as FinanceFlowNode;
}

export function createStartNode(position: XYPosition = { x: 160, y: 240 }): FinanceFlowNode {
  return baseNode(
    'start-root',
    'start',
    position,
    {
      kind: 'start',
      label: 'Start',
      subtitle: 'Begin workflow execution',
      icon: '▶',
      accentColor: '#00d18f',
    },
    { draggable: false }
  );
}

export function createParentTableNode(position: XYPosition = { x: 420, y: 180 }): FinanceFlowNode {
  const data: ParentTableNodeData = {
    kind: 'parentTable',
    label: 'Parent Table',
    subtitle: 'Adds child tables per row',
    icon: 'PT',
    accentColor: '#8b5cf6',
    description: 'Parent-child budget table generator',
    rows: [],
  };

  return baseNode(nextId('parentTable'), 'parentTable', position, data);
}

export function createChildTableNode(params: {
  position: XYPosition;
  label: string;
  parentNodeId: string;
  rowId: string;
  headerColor: string;
  subheaderColor: string;
}): FinanceFlowNode {
  const data: ChildTableNodeData = {
    kind: 'childTable',
    label: params.label,
    subtitle: 'Child table from parent row',
    icon: 'CT',
    accentColor: params.headerColor,
    parentNodeId: params.parentNodeId,
    rowId: params.rowId,
    headerColor: params.headerColor,
    subheaderColor: params.subheaderColor,
    columns: ['Budget', 'Actual', 'Diff'],
  };

  return baseNode(nextId('childTable'), 'childTable', params.position, data);
}

function createWidgetData(type: FinanceWidgetKind): WidgetNodeData {
  switch (type) {
    case 'transactionTable':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'tables',
        label: 'Transaction Table',
        subtitle: 'Raw transaction rows and tags',
        icon: 'TB',
        accentColor: '#3b82f6',
        metrics: ['Rows 1,284', 'Cols 9', 'Updated today'],
        previewKind: 'table',
        rowCount: 1284,
        dataSource: 'transactions.csv',
      };
    case 'budgetTable':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'tables',
        label: 'Budget Table',
        subtitle: 'Monthly budgets by category',
        icon: 'BT',
        accentColor: '#2563eb',
        metrics: ['Rows 38', 'Buckets 4', 'FY 2026'],
        previewKind: 'table',
        rowCount: 38,
        dataSource: 'budget-store',
      };
    case 'verticalBarChart':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'charts',
        label: 'Vertical Bar Chart',
        subtitle: 'Category comparison view',
        icon: 'VB',
        accentColor: '#f59e0b',
        metrics: ['Needs', 'Wants', 'Savings'],
        previewKind: 'barV',
      };
    case 'horizontalBarChart':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'charts',
        label: 'Horizontal Bar Chart',
        subtitle: 'Ranked spend breakdown',
        icon: 'HB',
        accentColor: '#f59e0b',
        metrics: ['Top categories', 'This month'],
        previewKind: 'barH',
      };
    case 'pieChart':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'charts',
        label: 'Pie Chart',
        subtitle: 'Budget distribution',
        icon: 'PI',
        accentColor: '#ec4899',
        metrics: ['Needs 42%', 'Wants 28%', 'Savings 30%'],
        previewKind: 'pie',
      };
    case 'trendLine':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'charts',
        label: 'Trend Line',
        subtitle: 'Monthly movement over time',
        icon: 'TR',
        accentColor: '#10b981',
        metrics: ['12 months', 'Rolling avg'],
        previewKind: 'line',
      };
    case 'calculate':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'operations',
        label: 'Calculate',
        subtitle: 'Formula and derived values',
        icon: '∑',
        accentColor: '#6366f1',
        metrics: ['Net = Income - Expense', 'Margin %'],
        previewKind: 'operation',
      };
    case 'filter':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'operations',
        label: 'Filter',
        subtitle: 'Conditions and row pruning',
        icon: 'FL',
        accentColor: '#6366f1',
        metrics: ['Month = Current', 'Bucket != Surplus'],
        previewKind: 'operation',
      };
    case 'income':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'finance',
        label: 'Income',
        subtitle: 'Track inflows and salary',
        icon: '$',
        accentColor: '#10b981',
        metrics: ['Monthly $7,812', '2 sources'],
        previewKind: 'finance',
      };
    case 'expense':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'finance',
        label: 'Expense',
        subtitle: 'Track outflows and categories',
        icon: '−',
        accentColor: '#ef4444',
        metrics: ['Monthly $5,924', '38 categories'],
        previewKind: 'finance',
      };
    case 'balance':
      return {
        kind: 'widget',
        widgetType: type,
        category: 'finance',
        label: 'Balance',
        subtitle: 'Cash flow and net position',
        icon: '≈',
        accentColor: '#14b8a6',
        metrics: ['Net +$1,888', 'Runway 4.2 mo'],
        previewKind: 'finance',
      };
    default:
      return {
        kind: 'widget',
        widgetType: type,
        category: 'operations',
        label: type,
        subtitle: 'Workflow node',
        icon: '•',
        accentColor: '#94a3b8',
        metrics: [],
      };
  }
}

export function createWidgetNode(type: FinanceWidgetKind, position: XYPosition): FinanceFlowNode {
  return baseNode(nextId(type), type, position, createWidgetData(type));
}

export function createNodeFromLibrary(type: FinanceNodeType, position: XYPosition): FinanceFlowNode | null {
  if (type === 'start') return createStartNode(position);
  if (type === 'parentTable') return createParentTableNode(position);
  if (type === 'childTable') {
    return createChildTableNode({
      position,
      label: 'Child Table',
      parentNodeId: 'manual',
      rowId: nextId('row'),
      headerColor: '#8b5cf6',
      subheaderColor: '#c4b5fd',
    });
  }

  return createWidgetNode(type, position);
}

export function createBlankWorkflowGraph(): WorkflowGraph {
  return {
    nodes: [createStartNode(), createParentTableNode()],
    edges: [],
  };
}

export function createEmptyWorkflowGraph(): WorkflowGraph {
  return {
    nodes: [],
    edges: [],
  };
}
