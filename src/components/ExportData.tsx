import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/calculations';
import type { User, Expense } from '@/types';
import type { DateRange } from '@/components/ui/date-range-picker';

interface ExportDataProps {
  expenses: Expense[];
  users: User[];
  dateRange: DateRange;
}

export function ExportData({ expenses, users, dateRange }: ExportDataProps) {
  const [exportDateFilter, setExportDateFilter] = useState<number>(30); // Default to 30 days

  // Filter expenses by the main date range
  const mainFilteredExpenses = (() => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  })();

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      food: 'อาหาร',
      transport: 'ขนส่ง',
      shopping: 'ช็อปปิ้ง',
      entertainment: 'บันเทิง',
      utilities: 'สาธารณูปโภค',
      other: 'อื่นๆ',
    };
    return categoryMap[category] || 'อื่นๆ';
  };

  // Filter expenses by date
  const getFilteredExpenses = (days: number) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return expenses.filter(expense => new Date(expense.date) >= startDate);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      'วันที่',
      'รายการ',
      'จำนวนเงิน',
      'ผู้จ่าย',
      'หมวดหมู่',
      'สถานะ',
      'การแบ่ง',
      'รายละเอียดการแบ่ง',
    ];

    const rows = mainFilteredExpenses.map(expense => {
      const date = new Date(expense.date).toLocaleDateString('th-TH');
      const paidBy = getUserName(expense.paidBy);
      const category = getCategoryLabel(expense.category);
      const status = expense.status === 'settled' ? 'เคลียแล้ว' : 'รอเคลีย';
      const splitType =
        expense.splitType === 'equal' ? 'แบ่งเท่าๆ กัน' : 'กำหนดเอง';

      let splitDetails = '';
      if (expense.splitType === 'equal') {
        const perPerson = expense.amount / expense.participants.length;
        splitDetails = expense.participants
          .map(id => `${getUserName(id)}: ${formatCurrency(perPerson)}`)
          .join(', ');
      } else {
        splitDetails = Object.entries(expense.customSplits || {})
          .map(
            ([userId, amount]) =>
              `${getUserName(userId)}: ${formatCurrency(amount)}`
          )
          .join(', ');
      }

      return [
        date,
        expense.description,
        formatCurrency(expense.amount),
        paidBy,
        category,
        status,
        splitType,
        splitDetails,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF'; // Add BOM for proper UTF-8 encoding in Excel
    downloadFile(
      BOM + csvContent,
      'share-expenses.csv',
      'text/csv;charset=utf-8;'
    );
  };

  const exportToJSON = () => {
    const jsonFilteredExpenses = getFilteredExpenses(exportDateFilter).filter(
      expense => {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      }
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: `${exportDateFilter} วันล่าสุด`,
      summary: {
        totalExpenses: jsonFilteredExpenses.length,
        totalAmount: jsonFilteredExpenses.reduce((sum, e) => sum + e.amount, 0),
        users: users.length,
      },
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        color: user.color,
      })),
      expenses: jsonFilteredExpenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paidBy,
        paidByName: getUserName(expense.paidBy),
        category: expense.category,
        categoryLabel: getCategoryLabel(expense.category),
        status: expense.status,
        statusLabel: expense.status === 'settled' ? 'เคลียแล้ว' : 'รอเคลีย',
        splitType: expense.splitType,
        participants: expense.participants,
        participantNames: expense.participants.map(id => getUserName(id)),
        customSplits: expense.customSplits,
        splits:
          expense.splitType === 'equal'
            ? expense.participants.reduce(
                (acc, id) => ({
                  ...acc,
                  [id]: expense.amount / expense.participants.length,
                }),
                {}
              )
            : expense.customSplits || {},
      })),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `share-expenses-${exportDateFilter}days.json`;
    downloadFile(jsonContent, filename, 'application/json');
  };

  const totalAmount = mainFilteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const oldestExpense =
    mainFilteredExpenses.length > 0
      ? new Date(
          Math.min(...mainFilteredExpenses.map(e => new Date(e.date).getTime()))
        )
      : null;
  const newestExpense =
    mainFilteredExpenses.length > 0
      ? new Date(
          Math.max(...mainFilteredExpenses.map(e => new Date(e.date).getTime()))
        )
      : null;

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900 thai-text">
            📊 ส่งออก/นำเข้าข้อมูล
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            บันทึกข้อมูลสำหรับสำรองหรือวิเคราะห์ต่อ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Data Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 thai-text">
              📋 ข้อมูลปัจจุบัน
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mainFilteredExpenses.length}
                </div>
                <div className="text-gray-600 thai-text">รายจ่าย</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-gray-600 thai-text">ยอดรวม</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {users.length}
                </div>
                <div className="text-gray-600 thai-text">ผู้ใช้</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {oldestExpense &&
                  newestExpense &&
                  oldestExpense.getTime() !== newestExpense.getTime()
                    ? `${Math.ceil((newestExpense.getTime() - oldestExpense.getTime()) / (1000 * 60 * 60 * 24))} วัน`
                    : mainFilteredExpenses.length > 0
                      ? '1 วัน'
                      : '0 วัน'}
                </div>
                <div className="text-gray-600 thai-text">ช่วงเวลา</div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 thai-text">
              📤 ส่งออกข้อมูล
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CSV Export */}
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 thai-text">
                      CSV (Excel)
                    </h4>
                    <p className="text-sm text-gray-600 thai-text">
                      เปิดใน Excel, Google Sheets
                    </p>
                  </div>
                </div>
                <Button
                  onClick={exportToCSV}
                  className="w-full shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                  disabled={mainFilteredExpenses.length === 0}
                >
                  💾 ดาวน์โหลด CSV ({mainFilteredExpenses.length} รายการ)
                </Button>
              </div>

              {/* JSON Export */}
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🔧</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 thai-text">
                      JSON (ข้อมูลดิบ)
                    </h4>
                    <p className="text-sm text-gray-600 thai-text">
                      ช่วง {exportDateFilter} วันล่าสุด
                    </p>
                  </div>
                </div>

                {/* Date Filter for JSON Export */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2 thai-text">
                    📅 ช่วงเวลา
                  </div>
                  <Tabs
                    value={exportDateFilter.toString()}
                    onValueChange={value =>
                      setExportDateFilter(parseInt(value))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-5 bg-gray-100 shadow-inner rounded-lg p-1 h-8">
                      <TabsTrigger
                        value="3"
                        className="text-xs thai-text rounded data-[state=active]:shadow-sm"
                      >
                        3 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="7"
                        className="text-xs thai-text rounded data-[state=active]:shadow-sm"
                      >
                        7 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="15"
                        className="text-xs thai-text rounded data-[state=active]:shadow-sm"
                      >
                        15 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="30"
                        className="text-xs thai-text rounded data-[state=active]:shadow-sm"
                      >
                        30 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="365"
                        className="text-xs thai-text rounded data-[state=active]:shadow-sm"
                      >
                        ทั้งหมด
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Button
                  onClick={exportToJSON}
                  variant="outline"
                  className="w-full shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                  disabled={mainFilteredExpenses.length === 0}
                >
                  💾 ดาวน์โหลด JSON (
                  {
                    getFilteredExpenses(exportDateFilter).filter(expense => {
                      const startDate = new Date(dateRange.startDate);
                      const endDate = new Date(dateRange.endDate);
                      endDate.setHours(23, 59, 59, 999);
                      const expenseDate = new Date(expense.date);
                      return expenseDate >= startDate && expenseDate <= endDate;
                    }).length
                  }{' '}
                  รายการ)
                </Button>
              </div>
            </div>
          </div>

          {mainFilteredExpenses.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600 thai-text">
                📝 ไม่มีข้อมูลรายจ่ายในช่วงวันที่ที่เลือก
                ลองเปลี่ยนช่วงวันที่หรือเพิ่มรายจ่าย
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
