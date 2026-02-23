import type { FinanceNodeType, LibraryCategory } from '../frontEndUtilities/types';

export interface WidgetDefinition {
  type: FinanceNodeType;
  name: string;
  description: string;
  icon: string;
  category: LibraryCategory;
  accent: 'blue' | 'purple' | 'orange' | 'pink' | 'green' | 'indigo' | 'red' | 'teal';
}

export const widgetDefinitions: WidgetDefinition[] = [
  { type: 'parentTable', name: 'Parent Table', description: 'Generates child tables from rows', icon: '◫', category: 'tables', accent: 'blue' },

  { type: 'verticalBarChart', name: 'Vertical Bar Chart', description: 'Compare categories with vertical bars', icon: '▥', category: 'charts', accent: 'orange' },
  { type: 'horizontalBarChart', name: 'Horizontal Bar Chart', description: 'Rank categories horizontally', icon: '☰', category: 'charts', accent: 'orange' },
  { type: 'pieChart', name: 'Pie Chart', description: 'Show distribution in a circular chart', icon: '◔', category: 'charts', accent: 'orange' },
  { type: 'trendLine', name: 'Trend Line', description: 'Track values over time', icon: '⌁', category: 'charts', accent: 'orange' },

  { type: 'calculate', name: 'Calculate', description: 'Create formulas and derived values', icon: '∑', category: 'operations', accent: 'indigo' },
  { type: 'filter', name: 'Filter', description: 'Apply conditions to rows and fields', icon: '⎇', category: 'operations', accent: 'indigo' },

  { type: 'income', name: 'Income', description: 'Track inflows and salary data', icon: '$', category: 'operations', accent: 'indigo' },
  { type: 'expense', name: 'Expense', description: 'Track outflows and spending', icon: '−', category: 'operations', accent: 'indigo' },
  { type: 'balance', name: 'Balance', description: 'Summarize net cash flow and balances', icon: '≈', category: 'operations', accent: 'indigo' },
];
