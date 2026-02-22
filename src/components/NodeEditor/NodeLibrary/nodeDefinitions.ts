import type { FinanceNodeType, LibraryCategory } from '../workflow/types';

export interface NodeDefinition {
  type: FinanceNodeType;
  name: string;
  description: string;
  icon: string;
  category: LibraryCategory;
  accent: 'blue' | 'purple' | 'orange' | 'pink' | 'green' | 'indigo' | 'red' | 'teal';
}

export const nodeDefinitions: NodeDefinition[] = [
  { type: 'transactionTable', name: 'Transaction Table', description: 'Raw transaction rows and imports', icon: '▦', category: 'tables', accent: 'blue' },
  { type: 'budgetTable', name: 'Budget Table', description: 'Monthly budget categories and buckets', icon: '▤', category: 'tables', accent: 'blue' },
  { type: 'parentTable', name: 'Parent Table', description: 'Generates child tables from rows', icon: '◫', category: 'tables', accent: 'purple' },

  { type: 'verticalBarChart', name: 'Vertical Bar Chart', description: 'Compare categories with vertical bars', icon: '▥', category: 'charts', accent: 'orange' },
  { type: 'horizontalBarChart', name: 'Horizontal Bar Chart', description: 'Rank categories horizontally', icon: '☰', category: 'charts', accent: 'orange' },
  { type: 'pieChart', name: 'Pie Chart', description: 'Show distribution in a circular chart', icon: '◔', category: 'charts', accent: 'pink' },
  { type: 'trendLine', name: 'Trend Line', description: 'Track values over time', icon: '⌁', category: 'charts', accent: 'green' },

  { type: 'calculate', name: 'Calculate', description: 'Create formulas and derived values', icon: '∑', category: 'operations', accent: 'indigo' },
  { type: 'filter', name: 'Filter', description: 'Apply conditions to rows and fields', icon: '⎇', category: 'operations', accent: 'indigo' },

  { type: 'income', name: 'Income', description: 'Track inflows and salary data', icon: '$', category: 'finance', accent: 'green' },
  { type: 'expense', name: 'Expense', description: 'Track outflows and spending', icon: '−', category: 'finance', accent: 'red' },
  { type: 'balance', name: 'Balance', description: 'Summarize net cash flow and balances', icon: '≈', category: 'finance', accent: 'teal' },
];
