import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/calculations';
import type { User, Expense, ExpenseCategory } from '@/types';

interface ExpenseFormProps {
  users: User[];
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  editingExpense?: Expense;
  onCancel?: () => void;
}

export function ExpenseForm({
  users,
  onSubmit,
  editingExpense,
  onCancel,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(
    editingExpense?.description || ''
  );
  const [amount, setAmount] = useState(
    editingExpense?.amount?.toString() || ''
  );
  const [paidBy, setPaidBy] = useState(editingExpense?.paidBy || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>(
    editingExpense?.splitType || 'equal'
  );
  const [customSplits, setCustomSplits] = useState<Record<string, number>>(
    editingExpense?.customSplits || {}
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    editingExpense?.category || 'other'
  );

  // Quick amount buttons organized by categories
  const quickAmountCategories = {
    popular: [20, 50, 100, 200, 500], // ยอดนิยม
    small: [5, 10, 15, 25, 30, 40], // ของเล็ก
    food: [60, 80, 120, 150, 250, 300], // อาหาร
    large: [400, 600, 800, 1000, 1500, 2000], // ของใหญ่
  };

  // Utility functions for amount manipulation
  const handleQuickAmount = (quickAmount: number, action: 'set' | 'add') => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount =
      action === 'set' ? quickAmount : currentAmount + quickAmount;
    setAmount(newAmount.toString());
  };

  const handleUtilityAction = (
    action:
      | 'add5'
      | 'sub5'
      | 'add10'
      | 'sub10'
      | 'add50'
      | 'sub50'
      | 'add100'
      | 'sub100'
  ) => {
    const currentAmount = parseFloat(amount) || 0;
    let newAmount = currentAmount;

    switch (action) {
      case 'add5':
        newAmount = currentAmount + 5;
        break;
      case 'sub5':
        newAmount = Math.max(0, currentAmount - 5);
        break;
      case 'add10':
        newAmount = currentAmount + 10;
        break;
      case 'sub10':
        newAmount = Math.max(0, currentAmount - 10);
        break;
      case 'add50':
        newAmount = currentAmount + 50;
        break;
      case 'sub50':
        newAmount = Math.max(0, currentAmount - 50);
        break;
      case 'add100':
        newAmount = currentAmount + 100;
        break;
      case 'sub100':
        newAmount = Math.max(0, currentAmount - 100);
        break;
    }

    setAmount(newAmount.toString());
  };

  // Initialize slider values when amount or splitType changes
  useEffect(() => {
    if (splitType === 'equal') {
      setCustomSplits({});
    } else if (splitType === 'custom' && amount && users.length === 2) {
      const totalAmount = parseFloat(amount) || 0;
      if (totalAmount > 0) {
        // Only initialize if no custom splits exist
        setCustomSplits(prev => {
          if (Object.keys(prev).length === 0) {
            const equalSplit = totalAmount / 2;
            return {
              [users[0].id]: equalSplit,
              [users[1].id]: equalSplit,
            };
          }
          return prev;
        });
      }
    }
  }, [splitType, amount, users]);

  const handleSliderChange = (userId: string, value: number[]) => {
    if (users.length === 2) {
      const totalAmount = parseFloat(amount) || 0;
      const userAmount = value[0];
      const otherUser = users.find(user => user.id !== userId);

      if (otherUser && totalAmount > 0) {
        const remainingAmount = totalAmount - userAmount;
        setCustomSplits({
          [userId]: userAmount,
          [otherUser.id]: Math.max(0, remainingAmount),
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !paidBy) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    // All users are participants by default
    const participants = users.map(user => user.id);

    // Validate custom splits
    if (splitType === 'custom') {
      const splitTotal = participants.reduce((sum, userId) => {
        const splitAmount = customSplits[userId] || 0;
        return sum + splitAmount;
      }, 0);

      if (splitTotal !== amountNum) {
        alert('ยอดรวมการแบ่งเงินต้องเท่ากับจำนวนเงินทั้งหมด');
        return;
      }
    }

    const expenseData: Omit<Expense, 'id'> = {
      description: description.trim(),
      amount: amountNum,
      paidBy,
      participants,
      splitType,
      customSplits: splitType === 'custom' ? customSplits : undefined,
      date: editingExpense?.date || new Date().toISOString(),
      category,
    };

    onSubmit(expenseData);

    // Reset form if not editing
    if (!editingExpense) {
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSplitType('equal');
      setCustomSplits({});
      setCategory('other');
    }
  };

  const totalAmount = parseFloat(amount) || 0;

  // Category options
  const categoryOptions = [
    { value: 'food', label: '🍽️ อาหาร', emoji: '🍽️' },
    { value: 'transport', label: '🚗 ขนส่ง', emoji: '🚗' },
    { value: 'shopping', label: '🛒 ช็อปปิ้ง', emoji: '🛒' },
    { value: 'entertainment', label: '🎬 บันเทิง', emoji: '🎬' },
    { value: 'utilities', label: '💡 สาธารณูปโภค', emoji: '💡' },
    { value: 'other', label: '📂 อื่นๆ', emoji: '📂' },
  ] as const;

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-6  bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <CardTitle className="text-2xl font-semibold text-gray-900 thai-text">
            {editingExpense ? '✏️ แก้ไขรายจ่าย' : '➕ เพิ่มรายจ่าย'}
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            กรอกข้อมูลรายจ่าย ทุกคนจะแบ่งกันโดยอัตโนมัติ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description Input */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-900 thai-text"
              >
                📝 รายการ
              </Label>
              <Input
                id="description"
                placeholder="อาหารเที่ยง, ค่าน้ำมัน, ของใช้..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm thai-text"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-4">
              <Label
                htmlFor="amount"
                className="text-sm font-medium text-gray-900 thai-text"
              >
                💰 จำนวนเงิน (บาท)
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-8 shadow-sm font-semibold"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">
                  ฿
                </span>
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-700 thai-text flex items-center gap-2">
                  ⚡ เลือกจำนวนเงิน
                  {totalAmount > 0 && (
                    <span className="ml-auto text-lg font-bold text-blue-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  )}
                </div>

                <Tabs defaultValue="popular" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg h-10">
                    <TabsTrigger value="popular" className="text-xs thai-text">
                      🔥 นิยม
                    </TabsTrigger>
                    <TabsTrigger value="small" className="text-xs thai-text">
                      🛒 เล็ก
                    </TabsTrigger>
                    <TabsTrigger value="food" className="text-xs thai-text">
                      🍽️ อาหาร
                    </TabsTrigger>
                    <TabsTrigger value="large" className="text-xs thai-text">
                      💎 ใหญ่
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(quickAmountCategories).map(
                    ([category, amounts]) => (
                      <TabsContent
                        key={category}
                        value={category}
                        className="mt-3"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {amounts.map(quickAmount => (
                            <Button
                              key={quickAmount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuickAmount(quickAmount, 'set')
                              }
                              className="h-9 text-sm font-medium border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all duration-200 thai-text bg-white"
                            >
                              ฿{quickAmount}
                            </Button>
                          ))}
                        </div>
                      </TabsContent>
                    )
                  )}
                </Tabs>

                {/* Utility Buttons */}
                <div className="space-y-3 border-t pt-3">
                  <div className="text-xs text-gray-600 thai-text">
                    🛠️ เครื่องมือ:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('sub5')}
                        className="h-8 text-xs w-full border-red-300 hover:border-red-500 hover:text-red-600 thai-text"
                      >
                        -5
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('sub10')}
                        className="h-8 text-xs w-full border-red-300 hover:border-red-500 hover:text-red-600 thai-text"
                      >
                        -10
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('sub50')}
                        className="h-8 text-xs w-full border-red-300 hover:border-red-500 hover:text-red-600 thai-text"
                      >
                        -50
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('sub100')}
                        className="h-8 text-xs w-full border-red-300 hover:border-red-500 hover:text-red-600 thai-text"
                      >
                        -100
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('add5')}
                        className="h-8 text-xs w-full border-green-300 hover:border-green-500 hover:text-green-600 thai-text"
                      >
                        +5
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('add10')}
                        className="h-8 text-xs w-full border-green-300 hover:border-green-500 hover:text-green-600 thai-text"
                      >
                        +10
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('add50')}
                        className="h-8 text-xs w-full border-green-300 hover:border-green-500 hover:text-green-600 thai-text"
                      >
                        +50
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUtilityAction('add100')}
                        className="h-8 text-xs w-full border-green-300 hover:border-green-500 hover:text-green-600 thai-text"
                      >
                        +100
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 thai-text">
                📂 หมวดหมู่
              </Label>
              <Select
                value={category}
                onValueChange={value => setCategory(value as ExpenseCategory)}
              >
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
                  <SelectValue
                    placeholder="เลือกหมวดหมู่"
                    className="thai-text"
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="thai-text"
                    >
                      <div className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label.replace(/^.+\s/, '')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid By Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 thai-text">
                👤 ใครจ่าย
              </Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
                  <SelectValue
                    placeholder="เลือกผู้จ่าย"
                    className="thai-text"
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="thai-text"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: user.color }}
                        />
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 thai-text">
                ⚖️ วิธีแบ่ง
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  onClick={() => setSplitType('equal')}
                  className="h-11 justify-center shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                >
                  🤝 แบ่งเท่าๆ กัน
                </Button>
                <Button
                  type="button"
                  variant={splitType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSplitType('custom')}
                  className="h-11 justify-center shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                >
                  🎯 กำหนดเอง
                </Button>
              </div>
            </div>

            {/* Equal Split Preview */}
            {splitType === 'equal' && totalAmount > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-md">
                <h4 className="text-sm font-medium text-blue-900 mb-3 thai-text">
                  💡 การแบ่งเงิน
                </h4>
                <div className="space-y-2">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-sm text-gray-700 thai-text">
                          {user.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-blue-700">
                        {formatCurrency(totalAmount / users.length)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Split with Sliders */}
            {splitType === 'custom' && totalAmount > 0 && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-md">
                <h4 className="text-sm font-medium text-gray-900 thai-text">
                  🎚️ กำหนดจำนวนเงิน
                </h4>
                <div className="space-y-4">
                  {users.map((user, index) => {
                    const userAmount = customSplits[user.id] || 0;
                    const isLastUser = index === users.length - 1;

                    return (
                      <div
                        key={user.id}
                        className="space-y-3 bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: user.color }}
                            />
                            <span className="text-sm font-medium text-gray-900 thai-text">
                              {user.name}
                            </span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(userAmount)}
                          </span>
                        </div>

                        {!isLastUser || users.length > 2 ? (
                          <div className="space-y-2">
                            <Slider
                              value={[userAmount]}
                              onValueChange={value =>
                                handleSliderChange(user.id, value)
                              }
                              max={totalAmount}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>0</span>
                              <span>{totalAmount}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-2 bg-gray-100 rounded-full shadow-inner">
                            <div
                              className="h-2 bg-gray-400 rounded-full transition-all duration-200 shadow-sm"
                              style={{
                                width: `${totalAmount > 0 ? (userAmount / totalAmount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Validation Status */}
                  <div className="pt-3 border-t border-amber-200">
                    <div className="flex justify-between text-sm bg-white px-3 py-2 rounded-lg shadow-sm">
                      <span className="text-gray-600 thai-text">รวม:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Object.values(customSplits).reduce(
                            (sum, val) => sum + val,
                            0
                          )
                        )}{' '}
                        / {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                className="flex-1 h-11 shadow-md hover:shadow-lg transition-all duration-200 thai-text"
              >
                {editingExpense ? '💾 บันทึก' : '✨ เพิ่มรายจ่าย'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-11 px-6 shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                >
                  ❌ ยกเลิก
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
