import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DateRangePicker,
  type DateRange,
} from '@/components/ui/date-range-picker';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';

import { formatCurrency, calculateUserBalances } from '@/lib/calculations';
import type { User, Expense, ExpenseStatus } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDateRangeChange?: (dateRange: DateRange) => void;
  onUpdateStatus?: (id: string, status: ExpenseStatus) => void;
  dateRange: DateRange;
}

export function ExpenseList({
  expenses,
  users,
  onEdit,
  onDelete,
  onDateRangeChange,
  onUpdateStatus,
  dateRange,
}: ExpenseListProps) {
  // Use dateRange from props instead of local state
  const [localDateRange, setLocalDateRange] = useState<DateRange>(dateRange);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.color || '#6b7280';
  };

  const getStatusLabel = (status: ExpenseStatus) => {
    return status === 'settled' ? '✅ เคลียแล้ว' : '⏳ รอเคลีย';
  };

  const getStatusColor = (status: ExpenseStatus) => {
    return status === 'settled'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  // Calculate split amounts for an expense
  const calculateExpenseSplit = (expense: Expense) => {
    const splits: Record<string, number> = {};

    // Ensure we have participants, fallback to all users if not available
    const participants =
      expense.participants && expense.participants.length > 0
        ? expense.participants
        : users.map(user => user.id);

    if (expense.splitType === 'equal') {
      // Equal split among all participants
      const splitAmount = expense.amount / participants.length;
      participants.forEach(userId => {
        splits[userId] = splitAmount;
      });
    } else if (expense.splitType === 'custom' && expense.customSplits) {
      // Use custom splits
      participants.forEach(userId => {
        splits[userId] = expense.customSplits?.[userId] || 0;
      });
    } else {
      // Fallback to equal split if custom splits are missing
      const splitAmount = expense.amount / participants.length;
      participants.forEach(userId => {
        splits[userId] = splitAmount;
      });
    }

    return splits;
  };

  const toggleStatus = (expense: Expense) => {
    const newStatus = expense.status === 'settled' ? 'pending' : 'settled';
    onUpdateStatus?.(expense.id, newStatus);
  };

  const filterExpensesByDateRange = (expenses: Expense[], range: DateRange) => {
    const startDate = startOfDay(parseISO(range.startDate));
    const endDate = endOfDay(parseISO(range.endDate));

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });
  };

  const handleDateRangeChange = (newRange: Partial<DateRange>) => {
    const updatedRange = { ...localDateRange, ...newRange };
    setLocalDateRange(updatedRange);
    onDateRangeChange?.(updatedRange);
  };

  const filteredExpenses = filterExpensesByDateRange(expenses, localDateRange);
  const pendingExpenses = filteredExpenses.filter(
    expense => expense.status === 'pending'
  );
  const pendingAmount = pendingExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Calculate settlement suggestions for pending expenses
  const settlementSuggestions = useMemo(() => {
    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    const balances = calculateUserBalances(pendingExpenses, users);
    const balancesCopy = { ...balances };

    // Create sorted lists of creditors and debtors
    const creditors = Object.entries(balancesCopy)
      .filter(([, balance]) => balance > 0.01)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(balancesCopy)
      .filter(([, balance]) => balance < -0.01)
      .sort((a, b) => a[1] - b[1]);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const [creditorId, creditorBalance] = creditors[creditorIndex];
      const [debtorId, debtorBalance] = debtors[debtorIndex];

      const settlementAmount = Math.min(
        creditorBalance,
        Math.abs(debtorBalance)
      );

      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtorId,
          to: creditorId,
          amount: settlementAmount,
        });

        creditors[creditorIndex][1] -= settlementAmount;
        debtors[debtorIndex][1] += settlementAmount;

        if (creditors[creditorIndex][1] < 0.01) creditorIndex++;
        if (debtors[debtorIndex][1] > -0.01) debtorIndex++;
      } else {
        break;
      }
    }

    return settlements;
  }, [pendingExpenses, users]);

  // Handle bulk clear settlements
  const handleClearSettlements = () => {
    const settlementExpenseIds = pendingExpenses.map(expense => expense.id);
    settlementExpenseIds.forEach(id => {
      onUpdateStatus?.(id, 'settled');
    });
  };

  if (expenses.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2 thai-text">
            ยังไม่มีรายจ่าย
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 thai-text">
            เริ่มต้นโดยการเพิ่มรายจ่ายแรก
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Summary Section */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
        <CardHeader className="">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
            รายการค่าใช้จ่าย
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="space-y-4">
            {/* Date Range Picker */}
            <DateRangePicker
              dateRange={localDateRange}
              onDateRangeChange={handleDateRangeChange}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Each person's total payments */}
              {users.map(user => {
                const userExpenses = filteredExpenses.filter(
                  expense => expense.paidBy === user.id
                );
                const totalPaid = userExpenses.reduce(
                  (sum, expense) => sum + expense.amount,
                  0
                );
                const expenseCount = userExpenses.length;

                return (
                  <div
                    key={user.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium thai-text">
                        {user.name} จ่ายไป
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {formatCurrency(totalPaid)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 thai-text">
                      {expenseCount} รายการ
                    </div>
                  </div>
                );
              })}

              {/* Settlement status and button */}
              <div className="flex items-center justify-center">
                {pendingExpenses.length > 0 ? (
                  <div className="w-full">
                    {/* Show who owes whom */}
                    <div className="mb-2 space-y-1">
                      {settlementSuggestions.map((settlement, index) => (
                        <div
                          key={index}
                          className="text-xs text-emerald-600 dark:text-emerald-400 thai-text"
                        >
                          {getUserName(settlement.from)} เป็นหนี้{' '}
                          {getUserName(settlement.to)}
                          <span className="font-semibold">
                            {' '}
                            {formatCurrency(settlement.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-sm thai-text">
                          เคลียยอดทั้งหมด
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-semibold thai-text text-gray-900 dark:text-white">
                            ยืนยันเคลียยอด
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm thai-text text-gray-600 dark:text-gray-400">
                            จะทำการเคลียยอดรายการทั้งหมด{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {pendingExpenses.length}
                            </span>{' '}
                            รายการ ยอดรวม{' '}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(pendingAmount)}
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="h-9 px-4 text-sm thai-text">
                            ยกเลิก
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleClearSettlements}
                            className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-sm thai-text"
                          >
                            เคลียยอด
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 thai-text">
                      ไม่มีหนี้ค้างจ่าย
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense List - Table-like Display */}
      {filteredExpenses.length === 0 ? (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2 thai-text">
              ไม่มีรายจ่ายในช่วงเวลานี้
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 thai-text">
              ลองเลือกช่วงเวลาอื่น หรือเพิ่มรายจ่ายใหม่
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-3 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium text-sm text-gray-700 dark:text-gray-300">
              <div className="thai-text">วันที่/เวลา</div>
              <div className="thai-text">รายการ</div>
              <div className="thai-text">จำนวน</div>
              <div className="thai-text">ผู้จ่าย</div>
              <div className="thai-text">การแบ่ง</div>
              <div className="thai-text">สถานะ</div>
              <div className="thai-text text-center">จัดการ</div>
            </div>

            {/* Table Rows */}
            <div>
              {filteredExpenses
                .sort(
                  (a, b) =>
                    parseISO(b.date).getTime() - parseISO(a.date).getTime()
                )
                .map(expense => (
                  <div
                    key={expense.id}
                    className={`grid grid-cols-7 gap-3 p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      expense.status === 'settled' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Date */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 thai-text">
                      <div className="font-medium">
                        {format(parseISO(expense.date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-gray-500 dark:text-gray-500">
                        {format(parseISO(expense.date), 'HH:mm')}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                      {expense.description}
                    </div>

                    {/* Amount */}
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(expense.amount)}
                    </div>

                    {/* Paid By */}
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getUserColor(expense.paidBy),
                        }}
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300 thai-text">
                        {getUserName(expense.paidBy)}
                      </span>
                    </div>

                    {/* Split */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 thai-text">
                      {Object.entries(calculateExpenseSplit(expense)).map(
                        ([userId, amount], index) => (
                          <div key={userId} className="truncate">
                            {getUserName(userId)}: {formatCurrency(amount)}
                          </div>
                        )
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(expense)}
                        className={`h-7 px-2 text-xs border rounded-md font-medium thai-text ${
                          expense.status === 'settled'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                        }`}
                      >
                        {expense.status === 'settled' ? 'เคลีย' : 'รอ'}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(expense)}
                        className="h-7 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 thai-text"
                      >
                        แก้ไข
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 thai-text"
                          >
                            ลบ
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold thai-text text-gray-900 dark:text-white">
                              ยืนยันการลบ
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm thai-text text-gray-600 dark:text-gray-400">
                              ลบรายจ่าย "{expense.description}" จำนวน{' '}
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {formatCurrency(expense.amount)}
                              </span>
                              ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="h-9 px-4 text-sm thai-text">
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(expense.id)}
                              className="h-9 px-4 bg-red-500 hover:bg-red-600 text-sm thai-text"
                            >
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
