import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/calculations';
import type { User, Expense, ExpenseCategory } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({
  expenses,
  users,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>(
    'all'
  );

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '🌟 วันนี้';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '⏮️ เมื่อวาน';
    } else {
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const filterExpenses = (
    filter: string,
    query: string,
    catFilter: ExpenseCategory | 'all'
  ) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return expenses.filter(expense => {
      // Time filter
      const expenseDate = new Date(expense.date);
      let timeMatch = true;
      switch (filter) {
        case 'today':
          timeMatch = expenseDate >= today;
          break;
        case 'week':
          timeMatch = expenseDate >= weekAgo;
          break;
        case 'month':
          timeMatch = expenseDate >= monthAgo;
          break;
        default:
          timeMatch = true;
      }

      // Search filter
      const searchMatch =
        query === '' ||
        expense.description.toLowerCase().includes(query.toLowerCase());

      // Category filter
      const categoryMatch =
        catFilter === 'all' || expense.category === catFilter;

      return timeMatch && searchMatch && categoryMatch;
    });
  };

  const filteredExpenses = filterExpenses(
    timeFilter,
    searchQuery,
    categoryFilter
  );
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

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
      {/* Filter Tabs */}
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900 thai-text">
            📋 รายการค่าใช้จ่าย
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Input */}
          <div className="mb-4 space-y-3">
            <Input
              placeholder="🔍 ค้นหารายจ่าย..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm thai-text"
            />

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={value =>
                setCategoryFilter(value as ExpenseCategory | 'all')
              }
            >
              <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
                <SelectValue
                  placeholder="📂 เลือกหมวดหมู่"
                  className="thai-text"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="thai-text">
                  🌟 ทุกหมวดหมู่
                </SelectItem>
                <SelectItem value="food" className="thai-text">
                  🍽️ อาหาร
                </SelectItem>
                <SelectItem value="transport" className="thai-text">
                  🚗 ขนส่ง
                </SelectItem>
                <SelectItem value="shopping" className="thai-text">
                  🛒 ช็อปปิ้ง
                </SelectItem>
                <SelectItem value="entertainment" className="thai-text">
                  🎬 บันเทิง
                </SelectItem>
                <SelectItem value="utilities" className="thai-text">
                  💡 สาธารณูปโภค
                </SelectItem>
                <SelectItem value="other" className="thai-text">
                  📂 อื่นๆ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={timeFilter}
            onValueChange={value =>
              setTimeFilter(value as 'all' | 'today' | 'week' | 'month')
            }
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 shadow-inner rounded-xl p-1 h-12">
              <TabsTrigger
                value="all"
                className="text-sm thai-text rounded-lg data-[state=active]:shadow-md"
              >
                🌍 ทั้งหมด
              </TabsTrigger>
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

            <TabsContent value={timeFilter} className="mt-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner border border-gray-200">
                <span className="text-sm text-gray-600 thai-text">
                  📊 {filteredExpenses.length} รายการ
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Expense List */}
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
        <div className="space-y-4">
          {filteredExpenses
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map(expense => (
              <Card
                key={expense.id}
                className="shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left side - Description and details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 thai-text">
                          {expense.description}
                        </h3>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full shadow-sm">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{
                              backgroundColor: getUserColor(expense.paidBy),
                            }}
                          />
                          <span className="thai-text">
                            👤 {getUserName(expense.paidBy)} จ่าย
                          </span>
                        </div>
                        <span className="bg-gray-50 px-3 py-1 rounded-full shadow-sm thai-text">
                          🕒 {formatDate(expense.date)}
                        </span>
                        <span className="bg-gray-50 px-3 py-1 rounded-full shadow-sm thai-text">
                          {expense.splitType === 'equal'
                            ? '🤝 แบ่งเท่าๆ กัน'
                            : '🎯 กำหนดเอง'}
                        </span>
                        <span className="bg-blue-50 px-3 py-1 rounded-full shadow-sm thai-text text-blue-700 border border-blue-200">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </div>

                      {/* Split Details */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                        <h4 className="text-sm font-medium text-blue-900 mb-3 thai-text">
                          💰 การแบ่งเงิน
                        </h4>
                        {expense.splitType === 'equal' ? (
                          <div className="grid grid-cols-2 gap-3">
                            {users.map(user => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full shadow-sm"
                                    style={{ backgroundColor: user.color }}
                                  />
                                  <span className="text-sm text-gray-700 thai-text">
                                    {user.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-blue-700">
                                  {formatCurrency(
                                    expense.amount / users.length
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(expense.customSplits || {}).map(
                              ([userId, amount]) => (
                                <div
                                  key={userId}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full shadow-sm"
                                      style={{
                                        backgroundColor: getUserColor(userId),
                                      }}
                                    />
                                    <span className="text-sm text-gray-700 thai-text">
                                      {getUserName(userId)}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-700">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(expense)}
                        className="h-10 px-4 text-sm shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                      >
                        ✏️ แก้ไข
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 text-sm text-red-600 border-red-200 hover:bg-red-50 shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                          >
                            🗑️ ลบ
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
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
