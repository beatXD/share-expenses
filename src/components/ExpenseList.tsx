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
import { formatCurrency, calculateUserBalances } from '@/lib/calculations';
import type { User, Expense, ExpenseCategory, ExpenseStatus } from '@/types';

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

  const getCategoryLabel = (category: ExpenseCategory) => {
    const categoryMap = {
      food: '🍽️ อาหาร',
      transport: '🚗 ขนส่ง',
      shopping: '🛒 ช็อปปิ้ง',
      entertainment: '🎬 บันเทิง',
      utilities: '💡 สาธารณูปโภค',
      other: '📂 อื่นๆ',
    };
    return categoryMap[category];
  };

  const getStatusLabel = (status: ExpenseStatus) => {
    return status === 'settled' ? '✅ เคลียแล้ว' : '⏳ รอเคลีย';
  };

  const getStatusColor = (status: ExpenseStatus) => {
    return status === 'settled'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const toggleStatus = (expense: Expense) => {
    const newStatus = expense.status === 'settled' ? 'pending' : 'settled';
    onUpdateStatus?.(expense.id, newStatus);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filterExpensesByDateRange = (expenses: Expense[], range: DateRange) => {
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const handleDateRangeChange = (newRange: Partial<DateRange>) => {
    const updatedRange = { ...localDateRange, ...newRange };
    setLocalDateRange(updatedRange);
    onDateRangeChange?.(updatedRange);
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const newRange = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };

    setLocalDateRange(newRange);
    onDateRangeChange?.(newRange);
  };

  const filteredExpenses = filterExpensesByDateRange(expenses, localDateRange);
  const pendingExpenses = filteredExpenses.filter(
    expense => expense.status === 'pending'
  );
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
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
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl">
        <CardContent className="p-12 text-center">
          <div className="text-gray-300 text-8xl mb-6">📝</div>
          <CardTitle className="text-2xl font-semibold text-gray-900 mb-3 thai-text">
            ยังไม่มีรายจ่าย
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg thai-text">
            เริ่มต้นโดยการเพิ่มรายจ่ายแรกของคุณ
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Summary Section */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900 thai-text">
            📋 รายการค่าใช้จ่าย
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Date Range Picker */}
            <DateRangePicker
              dateRange={localDateRange}
              onDateRangeChange={handleDateRangeChange}
              onQuickSelect={setQuickDateRange}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-700 font-medium thai-text mb-1">
                  📊 ทั้งหมด
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-xs text-blue-600 thai-text">
                  {filteredExpenses.length} รายการ
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="text-sm text-orange-700 font-medium thai-text mb-1">
                  ⏳ รอเคลีย
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(pendingAmount)}
                </div>
                <div className="text-xs text-orange-600 thai-text">
                  {pendingExpenses.length} รายการ
                </div>
              </div>

              <div className="flex items-center justify-center">
                {pendingExpenses.length > 0 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 thai-text">
                        💸 เคลียยอดทั้งหมด
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl shadow-2xl border border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold thai-text">
                          💸 ยืนยันเคลียยอด
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base thai-text">
                          จะทำการเคลียยอดรายการทั้งหมด {pendingExpenses.length}{' '}
                          รายการ
                          <br />
                          ยอดรวม:{' '}
                          <span className="font-semibold text-green-600">
                            {formatCurrency(pendingAmount)}
                          </span>
                          <br />
                          <br />
                          <span className="text-orange-600 font-medium">
                            รายการที่เคลียแล้วจะไม่ถูกนำมาคำนวณใหม่
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="shadow-sm hover:shadow-md thai-text">
                          ❌ ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearSettlements}
                          className="bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md thai-text"
                        >
                          💸 เคลียยอด
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="text-center">
                    <div className="text-green-400 text-4xl mb-2">🎉</div>
                    <div className="text-sm font-medium text-green-600 thai-text">
                      ไม่มีหนี้ค้างจ่าย
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settlement Suggestions */}
            {settlementSuggestions.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 thai-text">
                  💡 คำแนะนำการชำระ
                </h4>
                <div className="space-y-2">
                  {settlementSuggestions.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getUserColor(settlement.from),
                            }}
                          />
                          <span className="text-sm text-gray-700 thai-text">
                            {getUserName(settlement.from)}
                          </span>
                        </div>
                        <div className="text-amber-500 text-sm">→</div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getUserColor(settlement.to),
                            }}
                          />
                          <span className="text-sm text-gray-700 thai-text">
                            {getUserName(settlement.to)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-amber-700">
                        {formatCurrency(settlement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense List - Table-like Display */}
      {filteredExpenses.length === 0 ? (
        <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="text-gray-300 text-6xl mb-4">🔍</div>
            <CardTitle className="text-lg font-medium text-gray-900 mb-2 thai-text">
              ไม่มีรายจ่ายในช่วงเวลานี้
            </CardTitle>
            <CardDescription className="text-gray-600 thai-text">
              ลองเลือกช่วงเวลาอื่น หรือเพิ่มรายจ่ายใหม่
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">
              <div className="thai-text">📝 รายการ</div>
              <div className="thai-text">💰 จำนวน</div>
              <div className="thai-text">👤 ผู้จ่าย</div>
              <div className="thai-text">📂 หมวดหมู่</div>
              <div className="thai-text">🕒 วันที่</div>
              <div className="thai-text">📊 สถานะ</div>
              <div className="thai-text text-center">⚙️ จัดการ</div>
            </div>

            {/* Table Rows */}
            <div>
              {filteredExpenses
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map(expense => (
                  <div
                    key={expense.id}
                    className={`grid grid-cols-7 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      expense.status === 'settled' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Description */}
                    <div className="font-medium text-gray-900 thai-text">
                      {expense.description}
                    </div>

                    {/* Amount */}
                    <div className="font-bold text-green-600">
                      {formatCurrency(expense.amount)}
                    </div>

                    {/* Paid By */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getUserColor(expense.paidBy),
                        }}
                      />
                      <span className="text-sm text-gray-700 thai-text">
                        {getUserName(expense.paidBy)}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="text-sm text-gray-600 thai-text">
                      {getCategoryLabel(expense.category)}
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-600 thai-text">
                      {formatDate(expense.date)}
                    </div>

                    {/* Status */}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(expense)}
                        className={`h-8 px-3 text-xs border-0 ${getStatusColor(expense.status)} hover:shadow-sm thai-text`}
                      >
                        {getStatusLabel(expense.status)}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(expense)}
                        className="h-8 px-3 text-xs hover:shadow-sm thai-text"
                      >
                        ✏️
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 thai-text"
                          >
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl shadow-2xl border border-gray-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold thai-text">
                              ⚠️ ยืนยันการลบ
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base thai-text">
                              คุณต้องการลบรายจ่าย "{expense.description}" จำนวน{' '}
                              <span className="font-semibold text-red-600">
                                {formatCurrency(expense.amount)}
                              </span>{' '}
                              หรือไม่?
                              <br />
                              <br />
                              <span className="text-red-600 font-medium">
                                การดำเนินการนี้ไม่สามารถย้อนกลับได้
                              </span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="shadow-sm hover:shadow-md thai-text">
                              ❌ ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(expense.id)}
                              className="bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md thai-text"
                            >
                              🗑️ ลบ
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
