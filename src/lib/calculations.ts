import type { Expense, User, Settlement, Summary } from '@/types';

export function calculateSplits(expense: Expense): Record<string, number> {
  if (expense.splitType === 'equal') {
    const splitAmount = expense.amount / expense.participants.length;
    return expense.participants.reduce(
      (acc, userId) => ({
        ...acc,
        [userId]: splitAmount,
      }),
      {}
    );
  }

  return expense.customSplits || {};
}

export function calculateUserBalances(
  expenses: Expense[],
  users: User[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize balances
  users.forEach(user => {
    balances[user.id] = 0;
  });

  // Only include pending expenses in balance calculations
  const pendingExpenses = expenses.filter(
    expense => expense.status === 'pending'
  );

  pendingExpenses.forEach(expense => {
    const splits = calculateSplits(expense);

    // Person who paid gets credited
    balances[expense.paidBy] += expense.amount;

    // Everyone owes their split
    Object.entries(splits).forEach(([userId, amount]) => {
      balances[userId] -= amount;
    });
  });

  return balances;
}

export function calculateSettlements(
  balances: Record<string, number>
): Settlement[] {
  const settlements: Settlement[] = [];
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  // Separate creditors and debtors
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: userId, amount: -balance });
    }
  });

  // Sort by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Create settlements
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: settleAmount,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return settlements;
}

export function generateSummary(
  expenses: Expense[],
  users: User[],
  period: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Summary {
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)
    );
  });

  // Only include pending expenses in summary calculations
  const pendingExpenses = filteredExpenses.filter(
    expense => expense.status === 'pending'
  );

  const totalExpenses = pendingExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const balances = calculateUserBalances(pendingExpenses, users);
  const settlements = calculateSettlements(balances);

  const userTotals: Record<string, number> = {};
  users.forEach(user => {
    userTotals[user.id] = pendingExpenses
      .filter(expense => expense.paidBy === user.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
  });

  return {
    totalExpenses,
    userTotals,
    settlements,
    period,
    startDate,
    endDate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
