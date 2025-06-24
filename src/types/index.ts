export interface User {
  id: string;
  name: string;
  color: string;
}

export type ExpenseStatus = 'pending' | 'settled';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // user id
  participants: string[]; // user ids
  splitType: 'equal' | 'custom';
  customSplits?: Record<string, number>; // user id -> amount
  date: string;
  status: ExpenseStatus;
}

export interface Settlement {
  from: string; // user id
  to: string; // user id
  amount: number;
}

export interface Summary {
  totalExpenses: number;
  userTotals: Record<string, number>;
  settlements: Settlement[];
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export type DateRange = {
  start: Date;
  end: Date;
};
