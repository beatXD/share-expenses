import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { UserManagement } from '@/components/UserManagement';
import { ExportData } from '@/components/ExportData';
import type { DateRange } from '@/components/ui/date-range-picker';
import type { User, Expense, ExpenseCategory, ExpenseStatus } from '@/types';

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'BEAT', color: '#3b82f6' },
  { id: '2', name: 'NART', color: '#ef4444' },
];

// Sample expenses for the past month
const generateSampleExpenses = (): Expense[] => {
  const today = new Date();
  const expenses: Expense[] = [];

  // Helper function to get random date in the past month
  const getRandomDateInPastMonth = (daysAgo: number) => {
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  // Sample data with realistic expenses
  const sampleData = [
    // Week 1 (1-7 days ago)
    {
      description: 'ข้าวผัดกุ้ง ร้านลุงสมชาย',
      amount: 180,
      paidBy: '1',
      category: 'food',
      daysAgo: 1,
    },
    {
      description: 'แกรบแท็กซี่ไปเซ็นทรัล',
      amount: 95,
      paidBy: '2',
      category: 'transport',
      daysAgo: 1,
    },
    {
      description: 'กาแฟ Amazon Coffee',
      amount: 140,
      paidBy: '1',
      category: 'food',
      daysAgo: 2,
    },
    {
      description: 'ซื้อเสื้อผ้า Uniqlo',
      amount: 1290,
      paidBy: '2',
      category: 'shopping',
      daysAgo: 3,
    },
    {
      description: 'อาหารเย็น MK สุกี้',
      amount: 580,
      paidBy: '1',
      category: 'food',
      daysAgo: 3,
    },
    {
      description: 'ค่าน้ำมันรถ PTT',
      amount: 800,
      paidBy: '2',
      category: 'transport',
      daysAgo: 4,
    },
    {
      description: 'ดูหนัง Major Cineplex',
      amount: 360,
      paidBy: '1',
      category: 'entertainment',
      daysAgo: 5,
    },
    {
      description: 'ข้าวเที่ยง ศูนย์อาหาร',
      amount: 120,
      paidBy: '2',
      category: 'food',
      daysAgo: 6,
    },
    {
      description: 'ซื้อของใช้ 7-Eleven',
      amount: 85,
      paidBy: '1',
      category: 'other',
      daysAgo: 7,
    },

    // Week 2 (8-14 days ago)
    {
      description: 'ค่าไฟฟ้าบ้าน',
      amount: 1450,
      paidBy: '2',
      category: 'utilities',
      daysAgo: 8,
    },
    {
      description: "อาหารเช้า McDonald's",
      amount: 195,
      paidBy: '1',
      category: 'food',
      daysAgo: 9,
    },
    {
      description: 'Bolt ไปสนามบิน',
      amount: 320,
      paidBy: '2',
      category: 'transport',
      daysAgo: 10,
    },
    {
      description: 'ซื้อหูฟัง AirPods',
      amount: 6900,
      paidBy: '1',
      category: 'shopping',
      daysAgo: 11,
    },
    {
      description: 'BBQ พลาซ่า บุฟเฟ่ต์',
      amount: 799,
      paidBy: '2',
      category: 'food',
      daysAgo: 12,
    },
    {
      description: 'คาราโอเกะ Music Box',
      amount: 450,
      paidBy: '1',
      category: 'entertainment',
      daysAgo: 13,
    },
    {
      description: 'ซื้อยา Boots Pharmacy',
      amount: 280,
      paidBy: '2',
      category: 'other',
      daysAgo: 14,
    },

    // Week 3 (15-21 days ago)
    {
      description: 'ข้าวแกงร้านป้าแดง',
      amount: 160,
      paidBy: '1',
      category: 'food',
      daysAgo: 15,
    },
    {
      description: 'ค่าน้ำประปา',
      amount: 280,
      paidBy: '2',
      category: 'utilities',
      daysAgo: 16,
    },
    {
      description: 'BTS ราชเทวี-สยาม',
      amount: 44,
      paidBy: '1',
      category: 'transport',
      daysAgo: 17,
    },
    {
      description: 'ซื้อเครื่องสำอาง Sephora',
      amount: 2100,
      paidBy: '2',
      category: 'shopping',
      daysAgo: 18,
    },
    {
      description: 'พิซซ่า Pizza Hut',
      amount: 650,
      paidBy: '1',
      category: 'food',
      daysAgo: 19,
    },
    {
      description: 'โบว์ลิ่ง RCA',
      amount: 380,
      paidBy: '2',
      category: 'entertainment',
      daysAgo: 20,
    },
    {
      description: 'ซื้อผงซักฟอก Big C',
      amount: 199,
      paidBy: '1',
      category: 'other',
      daysAgo: 21,
    },

    // Week 4 (22-30 days ago)
    {
      description: 'ค่าอินเทอร์เน็ต TRUE',
      amount: 990,
      paidBy: '2',
      category: 'utilities',
      daysAgo: 22,
    },
    {
      description: 'ข้าวมันไก่ตอนเที่ยง',
      amount: 50,
      paidBy: '1',
      category: 'food',
      daysAgo: 23,
    },
    {
      description: 'แท็กซี่ไปงานเลี้ยง',
      amount: 180,
      paidBy: '2',
      category: 'transport',
      daysAgo: 24,
    },
    {
      description: 'ซื้อรองเท้า Nike',
      amount: 3200,
      paidBy: '1',
      category: 'shopping',
      daysAgo: 25,
    },
    {
      description: 'ชาบู On The Table',
      amount: 750,
      paidBy: '2',
      category: 'food',
      daysAgo: 26,
    },
    {
      description: 'คอนเสิร์ต Impact Arena',
      amount: 1800,
      paidBy: '1',
      category: 'entertainment',
      daysAgo: 27,
    },
    {
      description: 'ซื้อสมุดและปากกา',
      amount: 350,
      paidBy: '2',
      category: 'other',
      daysAgo: 28,
    },
    {
      description: 'สปาเท้า Traditional Massage',
      amount: 400,
      paidBy: '1',
      category: 'entertainment',
      daysAgo: 29,
    },
    {
      description: 'ข้าวเย็น KFC',
      amount: 299,
      paidBy: '2',
      category: 'food',
      daysAgo: 30,
    },
  ];

  // Generate expenses with proper IDs and participants
  sampleData.forEach((data, index) => {
    expenses.push({
      id: (1000 + index).toString(),
      description: data.description,
      amount: data.amount,
      paidBy: data.paidBy,
      participants: ['1', '2'], // Both users participate in all expenses
      splitType: 'equal',
      date: getRandomDateInPastMonth(data.daysAgo),
      category: data.category as ExpenseCategory,
      status: 'pending' as ExpenseStatus, // All new sample data starts as pending
    });
  });

  return expenses;
};

const STORAGE_KEY = 'share-expenses-data';
const USERS_STORAGE_KEY = 'share-expenses-users';

// Helper functions for localStorage operations
const loadExpensesFromStorage = (): Expense[] => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate old expenses without category or status
        return parsed.map(expense => ({
          ...expense,
          category: expense.category || 'other',
          status: expense.status || 'pending',
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to load expenses from localStorage:', error);
  }
  // Return sample data if no saved data exists
  return generateSampleExpenses();
};

const saveExpensesToStorage = (expenses: Expense[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.warn('Failed to save expenses to localStorage:', error);
  }
};

// Helper functions for users localStorage operations
const loadUsersFromStorage = (): User[] => {
  try {
    const savedData = localStorage.getItem(USERS_STORAGE_KEY);
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
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save users to localStorage:', error);
  }
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize with last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = loadExpensesFromStorage();
    const savedUsers = loadUsersFromStorage();
    setExpenses(savedExpenses);
    setUsers(savedUsers);
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    saveExpensesToStorage(expenses);
  }, [expenses]);

  // Save users to localStorage whenever users change
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses(prev => [...prev, newExpense]);
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
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <span className="text-2xl text-white">💰</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 thai-text">
            Share Expenses
          </h1>
          <p className="text-lg text-gray-600 thai-text">
            แบ่งปันค่าใช้จ่าย คำนวณอัตโนมัติ
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="list" className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-lg rounded-xl p-1 h-14">
              <TabsTrigger
                value="list"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                📋 รายการ
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                ⭐ เพิ่มรายจ่าย
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                👥 ผู้ใช้
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                📊 ส่งออก
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
