import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import type { User, Expense } from '@/types';

interface ExportDataProps {
  expenses: Expense[];
  users: User[];
}

export function ExportData({ expenses, users }: ExportDataProps) {
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
      'การแบ่ง',
      'รายละเอียดการแบ่ง',
    ];

    const rows = expenses.map(expense => {
      const date = new Date(expense.date).toLocaleDateString('th-TH');
      const paidBy = getUserName(expense.paidBy);
      const category = getCategoryLabel(expense.category);
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
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        users: users.length,
      },
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        color: user.color,
      })),
      expenses: expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paidBy,
        paidByName: getUserName(expense.paidBy),
        category: expense.category,
        categoryLabel: getCategoryLabel(expense.category),
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
    downloadFile(jsonContent, 'share-expenses.json', 'application/json');
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Basic validation
        if (!data.expenses || !Array.isArray(data.expenses)) {
          alert('ไฟล์ไม่ถูกต้อง: ไม่พบข้อมูลรายจ่าย');
          return;
        }

        const confirmed = confirm(
          `พบข้อมูล ${data.expenses.length} รายการ\n` +
            `ต้องการนำเข้าข้อมูลหรือไม่?\n\n` +
            `⚠️ ข้อมูลปัจจุบันจะถูกแทนที่`
        );

        if (confirmed) {
          // Import logic would go here
          alert('ฟีเจอร์นำเข้าข้อมูลจะมาในเวอร์ชันถัดไป');
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  const totalAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const oldestExpense =
    expenses.length > 0
      ? new Date(Math.min(...expenses.map(e => new Date(e.date).getTime())))
      : null;
  const newestExpense =
    expenses.length > 0
      ? new Date(Math.max(...expenses.map(e => new Date(e.date).getTime())))
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
                  {expenses.length}
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
                    : expenses.length > 0
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
                  disabled={expenses.length === 0}
                >
                  💾 ดาวน์โหลด CSV
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
                      สำหรับสำรองข้อมูลหรือพัฒนา
                    </p>
                  </div>
                </div>
                <Button
                  onClick={exportToJSON}
                  variant="outline"
                  className="w-full shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                  disabled={expenses.length === 0}
                >
                  💾 ดาวน์โหลด JSON
                </Button>
              </div>
            </div>
          </div>

          {/* Import Options */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 thai-text">
              📥 นำเข้าข้อมูล
            </h3>

            <div className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">📁</div>
                <div>
                  <h4 className="font-semibold text-gray-900 thai-text">
                    JSON File
                  </h4>
                  <p className="text-sm text-gray-600 thai-text">
                    นำเข้าข้อมูลจากไฟล์ JSON ที่ส่งออกไว้
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept=".json"
                onChange={importFromJSON}
                className="hidden"
                id="json-import"
              />
              <label htmlFor="json-import">
                <Button
                  variant="outline"
                  className="w-full shadow-sm hover:shadow-md transition-all duration-200 thai-text cursor-pointer"
                  asChild
                >
                  <span>📁 เลือกไฟล์ JSON</span>
                </Button>
              </label>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 thai-text">
                ⚠️ หมายเหตุ: การนำเข้าข้อมูลจะแทนที่ข้อมูลปัจจุบันทั้งหมด
                กรุณาสำรองข้อมูลก่อนใช้งาน
              </p>
            </div>
          </div>

          {expenses.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600 thai-text">
                📝 ยังไม่มีข้อมูลรายจ่าย เพิ่มรายจ่ายก่อนเพื่อส่งออกข้อมูล
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
