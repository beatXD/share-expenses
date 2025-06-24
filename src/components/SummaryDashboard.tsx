import { useMemo, useState } from 'react';
import {
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
} from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { formatCurrency, calculateUserBalances } from '@/lib/calculations';
import type { User, Expense } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';

interface SummaryDashboardProps {
  expenses: Expense[];
  users: User[];
  dateRange: DateRange;
}

export function SummaryDashboard({
  expenses,
  users,
  dateRange,
}: SummaryDashboardProps) {
  const [settlementDateFilter, setSettlementDateFilter] = useState<number>(7); // Default to 7 days

  // Filter expenses by the main date range and only include pending expenses
  const filteredExpenses = useMemo(() => {
    const start = startOfDay(parseISO(dateRange.startDate));
    const end = endOfDay(parseISO(dateRange.endDate));

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return (
        isWithinInterval(expenseDate, { start, end }) &&
        expense.status === 'pending'
      );
    });
  }, [expenses, dateRange]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.color || '#6b7280';
  };

  const getExpensesByPeriod = (period: 'today' | 'week' | 'month') => {
    const today = startOfDay(new Date());

    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
    }

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= startDate && expense.status === 'pending';
    });
  };

  // Filter expenses by settlement date filter and only include pending expenses
  const getFilteredExpenses = (days: number) => {
    const startDate = subDays(new Date(), days);
    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= startDate && expense.status === 'pending';
    });
  };

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const weekExpenses = getExpensesByPeriod('week');
  const monthExpenses = getExpensesByPeriod('month');

  // Calculate user spending summary
  const userSpendingSummary = useMemo(() => {
    const summary: Record<string, { spent: number; paidOut: number }> = {};

    users.forEach(user => {
      summary[user.id] = { spent: 0, paidOut: 0 };
    });

    filteredExpenses.forEach(expense => {
      const splits =
        expense.splitType === 'equal'
          ? expense.participants.reduce(
              (acc, userId) => ({
                ...acc,
                [userId]: expense.amount / expense.participants.length,
              }),
              {}
            )
          : expense.customSplits || {};

      // Amount each user spent (their share)
      Object.entries(splits).forEach(([userId, amount]) => {
        if (summary[userId] && typeof amount === 'number') {
          summary[userId].spent += amount;
        }
      });

      // Amount each user paid out
      if (summary[expense.paidBy]) {
        summary[expense.paidBy].paidOut += expense.amount;
      }
    });

    return summary;
  }, [filteredExpenses, users]);

  // Calculate settlement suggestions based on filtered date
  const settlementSuggestions = useMemo(() => {
    const settlementFilteredExpenses =
      getFilteredExpenses(settlementDateFilter);
    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    const balances = calculateUserBalances(settlementFilteredExpenses, users);
    const balancesCopy = { ...balances };

    // Create sorted lists of creditors and debtors
    const creditors = Object.entries(balancesCopy)
      .filter(([, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(balancesCopy)
      .filter(([, balance]) => balance < 0)
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

      if (settlementAmount > 0) {
        settlements.push({
          from: debtorId,
          to: creditorId,
          amount: settlementAmount,
        });

        creditors[creditorIndex][1] -= settlementAmount;
        debtors[debtorIndex][1] += settlementAmount;

        if (creditors[creditorIndex][1] === 0) creditorIndex++;
        if (debtors[debtorIndex][1] === 0) debtorIndex++;
      }
    }

    return settlements;
  }, [filteredExpenses, users, settlementDateFilter]);

  if (filteredExpenses.length === 0) {
    return (
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl">
        <CardContent className="p-12 text-center">
          <div className="text-gray-300 text-8xl mb-6">📊</div>
          <CardTitle className="text-2xl font-semibold text-gray-900 mb-3 thai-text">
            ยังไม่มีข้อมูลสรุป
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg thai-text">
            เมื่อเพิ่มรายจ่ายแล้ว สรุปการเงินจะแสดงที่นี่
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-blue-700 font-medium thai-text">
                💼 ค่าใช้จ่ายทั้งหมด
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-xs text-blue-600 thai-text">
              📊 {filteredExpenses.length} รายการ
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-green-700 font-medium thai-text">
                📅 สัปดาห์นี้
              </div>
              <div className="text-3xl">🗓️</div>
            </div>
            <div className="text-3xl font-bold text-green-900 mb-1">
              {formatCurrency(
                weekExpenses.reduce((sum, e) => sum + e.amount, 0)
              )}
            </div>
            <div className="text-xs text-green-600 thai-text">
              📊 {weekExpenses.length} รายการ
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-purple-700 font-medium thai-text">
                🗓️ เดือนนี้
              </div>
              <div className="text-3xl">📆</div>
            </div>
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {formatCurrency(
                monthExpenses.reduce((sum, e) => sum + e.amount, 0)
              )}
            </div>
            <div className="text-xs text-purple-600 thai-text">
              📊 {monthExpenses.length} รายการ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Spending Summary - Simplified */}
      <Card className="shadow-lg border border-gray-200 bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900 thai-text">
            💳 สรุปรายได้-รายจ่าย
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 thai-text">
            เฉพาะรายการที่ยังไม่เคลีย
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {Object.entries(userSpendingSummary).map(([userId, summary]) => (
              <div
                key={userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getUserColor(userId) }}
                  />
                  <span className="font-medium text-sm text-gray-900 thai-text">
                    {getUserName(userId)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-blue-600">
                    ใช้: {formatCurrency(summary.spent)}
                  </span>
                  <span className="text-green-600">
                    จ่าย: {formatCurrency(summary.paidOut)}
                  </span>
                  <span
                    className={`font-bold ${
                      summary.paidOut - summary.spent > 0
                        ? 'text-green-600'
                        : summary.paidOut - summary.spent < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {summary.paidOut - summary.spent > 0 && '+'}
                    {formatCurrency(summary.paidOut - summary.spent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlement Suggestions */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 thai-text">
            💡 คำแนะนำการชำระ
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            วิธีจ่ายเงินให้เสร็จสิ้น (เฉพาะรายการที่ยังไม่เคลีย ช่วง{' '}
            {settlementDateFilter} วันล่าสุด)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Date Filter */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2 thai-text">
              📅 ช่วงเวลาการคำนวณ
            </div>
            <Tabs
              value={settlementDateFilter.toString()}
              onValueChange={value => setSettlementDateFilter(parseInt(value))}
            >
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 shadow-inner rounded-xl p-1 h-10">
                <TabsTrigger
                  value="3"
                  className="text-xs thai-text rounded-lg data-[state=active]:shadow-md"
                >
                  3 วัน
                </TabsTrigger>
                <TabsTrigger
                  value="5"
                  className="text-xs thai-text rounded-lg data-[state=active]:shadow-md"
                >
                  5 วัน
                </TabsTrigger>
                <TabsTrigger
                  value="7"
                  className="text-xs thai-text rounded-lg data-[state=active]:shadow-md"
                >
                  7 วัน
                </TabsTrigger>
                <TabsTrigger
                  value="15"
                  className="text-xs thai-text rounded-lg data-[state=active]:shadow-md"
                >
                  15 วัน
                </TabsTrigger>
                <TabsTrigger
                  value="30"
                  className="text-xs thai-text rounded-lg data-[state=active]:shadow-md"
                >
                  30 วัน
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {settlementSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-6xl mb-4">🎉</div>
              <div className="text-lg font-medium text-green-600 thai-text">
                ทุกคนชำระเงินเรียบร้อย
              </div>
              <div className="text-sm text-gray-500 mt-2 thai-text">
                ไม่มีหนี้สินค้างจ่ายในช่วง {settlementDateFilter} วันที่ผ่านมา
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {settlementSuggestions.map((settlement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm border border-white"
                        style={{
                          backgroundColor: getUserColor(settlement.from),
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 thai-text">
                        {getUserName(settlement.from)}
                      </span>
                    </div>
                    <div className="text-blue-400 text-lg">→</div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm border border-white"
                        style={{
                          backgroundColor: getUserColor(settlement.to),
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 thai-text">
                        {getUserName(settlement.to)}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-700 bg-white px-3 py-1 rounded-lg shadow-sm">
                    {formatCurrency(settlement.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
