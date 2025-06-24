import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { UserManagement } from '@/components/UserManagement';
import { ExportData } from '@/components/ExportData';
import { useTheme } from '@/contexts/ThemeContext';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Moon, Sun } from 'lucide-react';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { User, Expense, ExpenseStatus } from '@/types';

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'BEAT', color: '#3b82f6' },
  { id: '2', name: 'NART', color: '#ef4444' },
];

// Interface for JSON data structure
interface JsonData {
  exportDate: string;
  version: string;
  users: User[];
  expenses: Expense[];
}

// Helper functions for JSON file operations
const downloadJsonFile = (data: JsonData, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const loadJsonFile = (): Promise<JsonData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.oncancel = () => reject(new Error('File selection cancelled'));
    input.click();
  });
};

// Helper functions for localStorage operations
const loadExpensesFromStorage = (): Expense[] => {
  try {
    const savedData = localStorage.getItem('share-expenses-data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate old expenses without status
        return parsed.map(expense => ({
          ...expense,
          status: expense.status || 'pending',
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to load expenses from localStorage:', error);
  }
  return [];
};

const saveExpensesToStorage = (expenses: Expense[]) => {
  try {
    localStorage.setItem('share-expenses-data', JSON.stringify(expenses));
  } catch (error) {
    console.warn('Failed to save expenses to localStorage:', error);
  }
};

const loadUsersFromStorage = (): User[] => {
  try {
    const savedData = localStorage.getItem('share-expenses-users');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return Array.isArray(parsed) && parsed.length >= 2
        ? parsed
        : DEFAULT_USERS;
    }
  } catch (error) {
    console.warn('Failed to load users from localStorage:', error);
  }
  return DEFAULT_USERS;
};

const saveUsersToStorage = (users: User[]) => {
  try {
    localStorage.setItem('share-expenses-users', JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save users to localStorage:', error);
  }
};

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState('list');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize with this week (Monday to Sunday)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = loadExpensesFromStorage();
    const savedUsers = loadUsersFromStorage();
    setExpenses(savedExpenses);
    setUsers(savedUsers);
    setLastSaved(new Date());
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    if (expenses.length > 0 || users.length !== 2) {
      saveExpensesToStorage(expenses);
      setLastSaved(new Date());
    }
  }, [expenses, users.length]);

  // Save users to localStorage whenever users change
  useEffect(() => {
    saveUsersToStorage(users);
    setLastSaved(new Date());
  }, [users]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses(prev => [...prev, newExpense]);

    // Switch back to list tab after adding
    setActiveTab('list');
  };

  const updateExpense = (updatedExpense: Omit<Expense, 'id'>) => {
    if (!editingExpense) return;

    setExpenses(prev =>
      prev.map(expense =>
        expense.id === editingExpense.id
          ? { ...updatedExpense, id: editingExpense.id }
          : expense
      )
    );
    setEditingExpense(null);

    // Switch back to list tab after updating
    setActiveTab('list');
  };

  const updateExpenseStatus = (id: string, status: ExpenseStatus) => {
    setExpenses(prev =>
      prev.map(expense =>
        expense.id === id ? { ...expense, status } : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setActiveTab('add'); // Switch to add tab for editing
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setActiveTab('list'); // Go back to list tab
  };

  // Export data to JSON file
  const handleExportData = () => {
    const data: JsonData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      users: users,
      expenses: expenses,
    };
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJsonFile(data, `share-expenses-${timestamp}.json`);
  };

  // Import data from JSON file
  const handleImportData = async () => {
    try {
      const data = await loadJsonFile();

      // Validate data structure
      if (
        !data.users ||
        !data.expenses ||
        !Array.isArray(data.users) ||
        !Array.isArray(data.expenses)
      ) {
        alert('ไฟล์ JSON ไม่ถูกต้อง: ขาดข้อมูล users หรือ expenses');
        return;
      }

      // Ensure minimum users
      if (data.users.length < 2) {
        alert('ต้องมีผู้ใช้อย่างน้อย 2 คน');
        return;
      }

      // Confirm before importing
      const confirmImport = confirm(
        `นำเข้าข้อมูล ${data.users.length} ผู้ใช้ และ ${data.expenses.length} รายจ่าย?\n\nข้อมูลปัจจุบันจะถูกแทนที่`
      );

      if (!confirmImport) return;

      // Validate and migrate expenses
      const validExpenses = data.expenses.map((expense: Expense) => ({
        ...expense,
        status: expense.status || 'pending',
      }));

      setUsers(data.users);
      setExpenses(validExpenses);

      alert(
        `นำเข้าข้อมูลสำเร็จ! ${data.users.length} ผู้ใช้, ${validExpenses.length} รายจ่าย`
      );
    } catch (error) {
      alert(
        `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'ไม่สามารถอ่านไฟล์ได้'}`
      );
    }
  };

  // Clear all data
  const handleClearData = () => {
    if (
      confirm(
        'คุณต้องการล้างข้อมูลทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
      )
    ) {
      setExpenses([]);
      setUsers(DEFAULT_USERS);
      localStorage.removeItem('share-expenses-data');
      localStorage.removeItem('share-expenses-users');
      alert('ล้างข้อมูลทั้งหมดเรียบร้อย');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white thai-text">
                  Share Expenses
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 thai-text">
                  แบ่งปันค่าใช้จ่าย คำนวณอัตโนมัติ
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle & Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2 border-gray-300 dark:border-gray-600"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <button
                onClick={handleExportData}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm thai-text"
              >
                ส่งออก
              </button>
              <button
                onClick={handleImportData}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm thai-text"
              >
                นำเข้า
              </button>
              <button
                onClick={handleClearData}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm thai-text"
              >
                ล้าง
              </button>
            </div>
          </div>

          {/* Save Status */}
          {lastSaved && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 thai-text">
              บันทึกล่าสุด: {lastSaved.toLocaleTimeString('th-TH')}
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 h-10 rounded-lg">
              <TabsTrigger
                value="list"
                className="text-sm h-8 rounded-md data-[state=active]:bg-emerald-500 data-[state=active]:text-white thai-text"
              >
                รายการ
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="text-sm h-8 rounded-md data-[state=active]:bg-emerald-500 data-[state=active]:text-white thai-text"
              >
                เพิ่ม
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="text-sm h-8 rounded-md data-[state=active]:bg-emerald-500 data-[state=active]:text-white thai-text"
              >
                ผู้ใช้
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="text-sm h-8 rounded-md data-[state=active]:bg-emerald-500 data-[state=active]:text-white thai-text"
              >
                ส่งออก
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0">
            <ExpenseList
              expenses={expenses}
              users={users}
              onEdit={handleEdit}
              onDelete={deleteExpense}
              onDateRangeChange={setDateRange}
              onUpdateStatus={updateExpenseStatus}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <ExpenseForm
              users={users}
              onSubmit={editingExpense ? updateExpense : addExpense}
              editingExpense={editingExpense || undefined}
              onCancel={editingExpense ? handleCancelEdit : undefined}
            />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UserManagement users={users} onUsersChange={setUsers} />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportData
              expenses={expenses}
              users={users}
              dateRange={dateRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
