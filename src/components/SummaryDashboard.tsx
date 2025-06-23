import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { formatCurrency, calculateUserBalances } from '@/lib/calculations';
import type { User, Expense } from '@/types';

interface SummaryDashboardProps {
  expenses: Expense[];
  users: User[];
}

export function SummaryDashboard({ expenses, users }: SummaryDashboardProps) {
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getUserColor = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.color || '#6b7280';
  };

  const getExpensesByPeriod = (period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return expenses.filter(expense => new Date(expense.date) >= startDate);
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const todayExpenses = getExpensesByPeriod('today');
  const weekExpenses = getExpensesByPeriod('week');
  const monthExpenses = getExpensesByPeriod('month');

  // Calculate user spending summary
  const userSpendingSummary = useMemo(() => {
    const summary: Record<string, { spent: number; paidOut: number }> = {};

    users.forEach(user => {
      summary[user.id] = { spent: 0, paidOut: 0 };
    });

    expenses.forEach(expense => {
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
  }, [expenses, users]);

  // Calculate settlement suggestions
  const settlementSuggestions = useMemo(() => {
    const settlements: Array<{ from: string; to: string; amount: number }> = [];
    const balances = calculateUserBalances(expenses, users);
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
  }, [expenses, users]);

  if (expenses.length === 0) {
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
              📊 {expenses.length} รายการ
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

      {/* User Spending Summary */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 thai-text">
            💳 สรุปรายได้-รายจ่าย
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            แต่ละคนใช้เท่าไหร่ และออกเงินเท่าไร่
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {Object.entries(userSpendingSummary).map(([userId, summary]) => (
            <div
              key={userId}
              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-5 h-5 rounded-full shadow-md border-2 border-white"
                  style={{ backgroundColor: getUserColor(userId) }}
                />
                <span className="font-bold text-lg text-gray-900 thai-text">
                  {getUserName(userId)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1 thai-text">
                    💰 ใช้ไป (ส่วนแบ่ง)
                  </div>
                  <div className="text-lg font-bold text-blue-800">
                    {formatCurrency(summary.spent)}
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 mb-1 thai-text">
                    💸 ออกเงิน (จ่ายจริง)
                  </div>
                  <div className="text-lg font-bold text-green-800">
                    {formatCurrency(summary.paidOut)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 thai-text">
                    ผลต่าง:
                  </span>
                  <span
                    className={`text-sm font-bold ${
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
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Settlement Suggestions */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 thai-text">
            💡 คำแนะนำการชำระ
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            วิธีจ่ายเงินให้เสร็จสิ้น
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {settlementSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-6xl mb-4">🎉</div>
              <div className="text-lg font-medium text-green-600 thai-text">
                ทุกคนชำระเงินเรียบร้อย
              </div>
              <div className="text-sm text-gray-500 mt-2 thai-text">
                ไม่มีหนี้สินค้างจ่าย
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

      {/* Time Period Summary */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 thai-text">
            📈 สรุปตามช่วงเวลา
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            รายจ่ายในแต่ละช่วงเวลา
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 shadow-inner rounded-xl p-1 h-12">
              <TabsTrigger
                value="today"
                className="text-sm thai-text rounded-lg data-[state=active]:shadow-md"
              >
                🌟 วันนี้
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="text-sm thai-text rounded-lg data-[state=active]:shadow-md"
              >
                📅 7 วัน
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="text-sm thai-text rounded-lg data-[state=active]:shadow-md"
              >
                🗓️ 30 วัน
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner border border-gray-200">
                  <span className="text-sm text-gray-600 thai-text">
                    🌟 รวมวันนี้
                  </span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(
                      todayExpenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                </div>
                {todayExpenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 thai-text">
                    <div className="text-4xl mb-2">😴</div>
                    ไม่มีรายจ่ายวันนี้
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map(user => {
                      const userExpenses = todayExpenses.filter(
                        e => e.paidBy === user.id
                      );
                      const userTotal = userExpenses.reduce(
                        (sum, e) => sum + e.amount,
                        0
                      );
                      if (userTotal === 0) return null;

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: user.color }}
                            />
                            <span className="text-sm text-gray-700 thai-text">
                              {user.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(userTotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="week" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner border border-gray-200">
                  <span className="text-sm text-gray-600 thai-text">
                    📅 รวม 7 วัน
                  </span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(
                      weekExpenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                </div>
                <div className="space-y-3">
                  {users.map(user => {
                    const userExpenses = weekExpenses.filter(
                      e => e.paidBy === user.id
                    );
                    const userTotal = userExpenses.reduce(
                      (sum, e) => sum + e.amount,
                      0
                    );
                    if (userTotal === 0) return null;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: user.color }}
                          />
                          <span className="text-sm text-gray-700 thai-text">
                            {user.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(userTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="month" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner border border-gray-200">
                  <span className="text-sm text-gray-600 thai-text">
                    🗓️ รวม 30 วัน
                  </span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(
                      monthExpenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                </div>
                <div className="space-y-3">
                  {users.map(user => {
                    const userExpenses = monthExpenses.filter(
                      e => e.paidBy === user.id
                    );
                    const userTotal = userExpenses.reduce(
                      (sum, e) => sum + e.amount,
                      0
                    );
                    if (userTotal === 0) return null;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: user.color }}
                          />
                          <span className="text-sm text-gray-700 thai-text">
                            {user.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(userTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
