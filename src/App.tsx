import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { UserManagement } from '@/components/UserManagement';
import { ExportData } from '@/components/ExportData';
import type { User, Expense } from '@/types';

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'BEAT', color: '#3b82f6' },
  { id: '2', name: 'NART', color: '#ef4444' },
];

const STORAGE_KEY = 'share-expenses-data';
const USERS_STORAGE_KEY = 'share-expenses-users';

// Helper functions for localStorage operations
const loadExpensesFromStorage = (): Expense[] => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed)) {
        // Migrate old expenses without category to have 'other' category
        return parsed.map(expense => ({
          ...expense,
          category: expense.category || 'other',
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
        <Tabs defaultValue="add" className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 shadow-lg rounded-xl p-1 h-14">
              <TabsTrigger
                value="add"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                ⭐ เพิ่มรายจ่าย
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                📋 รายการ
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="text-sm font-medium h-11 rounded-lg data-[state=active]:shadow-md thai-text"
              >
                📊 สรุป
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

          <TabsContent value="add" className="mt-0">
            <ExpenseForm
              users={users}
              onSubmit={editingExpense ? updateExpense : addExpense}
              editingExpense={editingExpense || undefined}
              onCancel={editingExpense ? handleCancelEdit : undefined}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ExpenseList
              expenses={expenses}
              users={users}
              onEdit={handleEdit}
              onDelete={deleteExpense}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <SummaryDashboard expenses={expenses} users={users} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UserManagement users={users} onUsersChange={setUsers} />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportData expenses={expenses} users={users} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
