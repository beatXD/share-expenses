import { useState } from 'react';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
  min,
  max,
  differenceInDays,
} from 'date-fns';
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
    const start = startOfDay(parseISO(dateRange.startDate));
    const end = endOfDay(parseISO(dateRange.endDate));

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start, end });
    });
  })();

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  // Filter expenses by date
  const getFilteredExpenses = (days: number) => {
    const startDate = subDays(new Date(), days);
    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= startDate;
    });
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
      const date = format(parseISO(expense.date), 'dd/MM/yyyy');
      const paidBy = getUserName(expense.paidBy);
      const category = 'ทั่วไป'; // Default category since category field doesn't exist
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
    const start = startOfDay(parseISO(dateRange.startDate));
    const end = endOfDay(parseISO(dateRange.endDate));

    const jsonFilteredExpenses = getFilteredExpenses(exportDateFilter).filter(
      expense => {
        const expenseDate = parseISO(expense.date);
        return isWithinInterval(expenseDate, { start, end });
      }
    );

    const exportData = {
      exportDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
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
        category: 'general',
        categoryLabel: 'ทั่วไป',
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
      ? min(mainFilteredExpenses.map(e => parseISO(e.date)))
      : null;
  const newestExpense =
    mainFilteredExpenses.length > 0
      ? max(mainFilteredExpenses.map(e => parseISO(e.date)))
      : null;

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
            ส่งออก/นำเข้าข้อมูล
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 thai-text text-sm">
            บันทึกข้อมูลสำหรับสำรองหรือวิเคราะห์ต่อ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Data Summary */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 thai-text">
              ข้อมูลปัจจุบัน
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {mainFilteredExpenses.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 thai-text">
                  รายจ่าย
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-gray-600 dark:text-gray-400 thai-text">
                  ยอดรวม
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {users.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 thai-text">
                  ผู้ใช้
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {oldestExpense &&
                  newestExpense &&
                  oldestExpense.getTime() !== newestExpense.getTime()
                    ? `${differenceInDays(newestExpense, oldestExpense) + 1} วัน`
                    : mainFilteredExpenses.length > 0
                      ? '1 วัน'
                      : '0 วัน'}
                </div>
                <div className="text-gray-600 dark:text-gray-400 thai-text">
                  ช่วงเวลา
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white thai-text">
              ส่งออกข้อมูล
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CSV Export */}
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white thai-text">
                      CSV (Excel)
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 thai-text">
                      เปิดใน Excel, Google Sheets
                    </p>
                  </div>
                </div>
                <Button
                  onClick={exportToCSV}
                  className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-sm thai-text"
                  disabled={mainFilteredExpenses.length === 0}
                >
                  ดาวน์โหลด CSV ({mainFilteredExpenses.length} รายการ)
                </Button>
              </div>

              {/* JSON Export */}
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white thai-text">
                      JSON (ข้อมูลดิบ)
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 thai-text">
                      ช่วง {exportDateFilter} วันล่าสุด
                    </p>
                  </div>
                </div>

                {/* Date Filter for JSON Export */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 thai-text">
                    ช่วงเวลา
                  </div>
                  <Tabs
                    value={exportDateFilter.toString()}
                    onValueChange={value =>
                      setExportDateFilter(parseInt(value))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-600 rounded-lg p-1 h-7">
                      <TabsTrigger
                        value="3"
                        className="text-xs thai-text rounded h-6"
                      >
                        3 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="7"
                        className="text-xs thai-text rounded h-6"
                      >
                        7 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="15"
                        className="text-xs thai-text rounded h-6"
                      >
                        15 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="30"
                        className="text-xs thai-text rounded h-6"
                      >
                        30 วัน
                      </TabsTrigger>
                      <TabsTrigger
                        value="365"
                        className="text-xs thai-text rounded h-6"
                      >
                        ทั้งหมด
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Button
                  onClick={exportToJSON}
                  variant="outline"
                  className="w-full h-9 text-sm border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 thai-text"
                  disabled={mainFilteredExpenses.length === 0}
                >
                  ดาวน์โหลด JSON (
                  {(() => {
                    const start = startOfDay(parseISO(dateRange.startDate));
                    const end = endOfDay(parseISO(dateRange.endDate));
                    return getFilteredExpenses(exportDateFilter).filter(
                      expense => {
                        const expenseDate = parseISO(expense.date);
                        return isWithinInterval(expenseDate, { start, end });
                      }
                    ).length;
                  })()}{' '}
                  รายการ)
                </Button>
              </div>
            </div>
          </div>

          {mainFilteredExpenses.length === 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400 thai-text">
                ไม่มีข้อมูลรายจ่ายในช่วงวันที่ที่เลือก
                ลองเปลี่ยนช่วงวันที่หรือเพิ่มรายจ่าย
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
