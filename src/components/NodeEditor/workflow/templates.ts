import type { Edge } from '@xyflow/react';
import { createBlankWorkflowGraph, createWidgetNode } from './factories';
import { addParentRowAndChildTable } from './parentTableOperations';
import type { WorkflowDirectoryItem, WorkflowGraph } from './types';

function connect(source: string, target: string): Edge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'bezier',
    animated: false,
  };
}

export const workflowDirectoryItems: WorkflowDirectoryItem[] = [
  {
    id: 'monthly-budget-tracker',
    name: 'Monthly Budget Tracker',
    description: 'Parent-child budget tables with finance nodes and charts.',
    updatedLabel: 'Updated just now',
    accentColor: '#3b82f6',
  },
  {
    id: 'expense-analysis-dashboard',
    name: 'Expense Analysis Dashboard',
    description: 'Filter spend, compare buckets, and visualize trends.',
    updatedLabel: 'Updated today',
    accentColor: '#ec4899',
  },
  {
    id: 'revenue-forecasting',
    name: 'Revenue Forecasting',
    description: 'Track income trends and create forecast views.',
    updatedLabel: 'Updated today',
    accentColor: '#10b981',
  },
  {
    id: 'cash-flow-monitor',
    name: 'Cash Flow Monitor',
    description: 'Monitor inflow/outflow and projected net balance.',
    updatedLabel: 'Updated yesterday',
    accentColor: '#14b8a6',
  },
];

export function createStarterWorkflowGraph(): WorkflowGraph {
  let graph = createBlankWorkflowGraph();

  const parentNode = graph.nodes.find((node) => node.type === 'parentTable');
  if (!parentNode) return graph;

  graph = addParentRowAndChildTable(graph, parentNode.id, 'Housing');
  graph = addParentRowAndChildTable(graph, parentNode.id, 'Groceries');
  graph = addParentRowAndChildTable(graph, parentNode.id, 'Travel');

  const txTable = createWidgetNode('transactionTable', { x: 170, y: 520 });
  const budgetTable = createWidgetNode('budgetTable', { x: 470, y: 520 });
  const income = createWidgetNode('income', { x: 870, y: 120 });
  const expense = createWidgetNode('expense', { x: 870, y: 340 });
  const balance = createWidgetNode('balance', { x: 1180, y: 230 });
  const pie = createWidgetNode('pieChart', { x: 1180, y: 520 });
  const trend = createWidgetNode('trendLine', { x: 1480, y: 230 });
  const filter = createWidgetNode('filter', { x: 770, y: 520 });
  const calculate = createWidgetNode('calculate', { x: 1480, y: 520 });

  graph.nodes = [...graph.nodes, txTable, budgetTable, income, expense, balance, pie, trend, filter, calculate];

  const start = graph.nodes.find((node) => node.type === 'start');
  if (start) {
    graph.edges.push(connect(start.id, parentNode.id));
    graph.edges.push(connect(start.id, txTable.id));
    graph.edges.push(connect(start.id, budgetTable.id));
  }

  graph.edges.push(connect(txTable.id, filter.id));
  graph.edges.push(connect(budgetTable.id, parentNode.id));
  graph.edges.push(connect(parentNode.id, expense.id));
  graph.edges.push(connect(parentNode.id, pie.id));
  graph.edges.push(connect(income.id, balance.id));
  graph.edges.push(connect(expense.id, balance.id));
  graph.edges.push(connect(balance.id, trend.id));
  graph.edges.push(connect(filter.id, calculate.id));
  graph.edges.push(connect(calculate.id, trend.id));

  return graph;
}
