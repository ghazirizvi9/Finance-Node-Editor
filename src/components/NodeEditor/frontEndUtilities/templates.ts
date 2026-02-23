import type { WorkflowDirectoryItem } from './types';

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
