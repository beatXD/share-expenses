import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import {
  format,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  parseISO,
} from 'date-fns';
import { th } from 'date-fns/locale';
import { TimePicker } from '@/components/ui/time-picker';
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
import { cn } from '@/lib/utils';

import { formatCurrency } from '@/lib/calculations';
import type { User, Expense } from '@/types';

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
  const [selectedDate, setSelectedDate] = useState<Date>(
    editingExpense?.date ? parseISO(editingExpense.date) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    editingExpense?.date
      ? format(parseISO(editingExpense.date), 'HH:mm')
      : format(new Date(), 'HH:mm')
  );
  const [isDateOpen, setIsDateOpen] = useState(false);

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
      date: combineDateTime(selectedDate, selectedTime),
      status: editingExpense?.status || 'pending',
    };

    onSubmit(expenseData);

    // Reset form if not editing
    if (!editingExpense) {
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSplitType('equal');
      setCustomSplits({});
      setSelectedDate(new Date()); // Reset to current date
      setSelectedTime(format(new Date(), 'HH:mm')); // Reset to current time
    }
  };

  const totalAmount = parseFloat(amount) || 0;

  // Helper function to format date as DD/MM/YYYY
  const formatDateToDDMMYYYY = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
  };

  // Helper function to combine date and time
  const combineDateTime = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':');

    // Use date-fns to properly set time without timezone issues
    let combinedDate = setSeconds(setMilliseconds(date, 0), 0);
    combinedDate = setHours(combinedDate, parseInt(hours, 10));
    combinedDate = setMinutes(combinedDate, parseInt(minutes, 10));

    // Return in ISO format but maintain local time
    return format(combinedDate, "yyyy-MM-dd'T'HH:mm:ss");
  };

  return (
    <div className="w-full">
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
            {editingExpense ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 thai-text text-sm">
            กรอกข้อมูลรายจ่าย
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description Input */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-900 dark:text-white thai-text"
              >
                รายการ
              </Label>
              <Input
                id="description"
                placeholder="อาหารเที่ยง, ค่าน้ำมัน, ของใช้..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-9 text-sm border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white thai-text"
              />
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                  วันที่
                </Label>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left h-9 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {selectedDate ? (
                        <span className="thai-text">
                          {formatDateToDDMMYYYY(selectedDate)}
                        </span>
                      ) : (
                        <span className="thai-text">เลือกวันที่</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={date => {
                        if (date) {
                          setSelectedDate(date);
                          setIsDateOpen(false);
                        }
                      }}
                      captionLayout="dropdown"
                      locale={th}
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                  เวลา
                </Label>
                <TimePicker
                  value={selectedTime}
                  onChange={setSelectedTime}
                  placeholder="เลือกเวลา"
                />
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-sm font-medium text-gray-900 dark:text-white thai-text"
              >
                จำนวนเงิน (บาท)
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-9 text-sm border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 pl-8 dark:bg-gray-700 dark:text-white font-medium"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 text-sm font-medium">
                  ฿
                </span>
              </div>
            </div>

            {/* Paid By Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                ใครจ่าย
              </Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-9 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                วิธีแบ่ง
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  onClick={() => setSplitType('equal')}
                  className={`h-9 text-sm thai-text ${
                    splitType === 'equal'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  แบ่งเท่าๆ กัน
                </Button>
                <Button
                  type="button"
                  variant={splitType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSplitType('custom')}
                  className={`h-9 text-sm thai-text ${
                    splitType === 'custom'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  กำหนดเอง
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
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-sm thai-text"
              >
                {editingExpense ? 'บันทึก' : 'เพิ่มรายจ่าย'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-9 px-4 text-sm border-gray-300 dark:border-gray-600 thai-text dark:text-gray-300"
                >
                  ยกเลิก
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
