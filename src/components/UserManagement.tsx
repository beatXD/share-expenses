import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { User } from '@/types';

interface UserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#eab308',
];

export function UserManagement({ users, onUsersChange }: UserManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserColor, setNewUserColor] = useState(DEFAULT_COLORS[0]);

  const handleAddUser = () => {
    if (!newUserName.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName.trim(),
      color: newUserColor,
    };

    onUsersChange([...users, newUser]);
    setNewUserName('');
    setNewUserColor(DEFAULT_COLORS[0]);
    setIsAddDialogOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserColor(user.color);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !newUserName.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    const updatedUsers = users.map(user =>
      user.id === editingUser.id
        ? { ...user, name: newUserName.trim(), color: newUserColor }
        : user
    );

    onUsersChange(updatedUsers);
    setEditingUser(null);
    setNewUserName('');
    setNewUserColor(DEFAULT_COLORS[0]);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 2) {
      alert('ต้องมีผู้ใช้อย่างน้อย 2 คน');
      return;
    }

    const updatedUsers = users.filter(user => user.id !== userId);
    onUsersChange(updatedUsers);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUserName('');
    setNewUserColor(DEFAULT_COLORS[0]);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
            จัดการผู้ใช้
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 thai-text text-sm">
            เพิ่ม แก้ไข หรือลบผู้ใช้ในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Add User Button */}
          <div className="mb-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-sm thai-text">
                  เพิ่มผู้ใช้ใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
                    เพิ่มผู้ใช้ใหม่
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 thai-text">
                    กรอกข้อมูลผู้ใช้ใหม่ที่ต้องการเพิ่ม
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-900 dark:text-white thai-text"
                    >
                      ชื่อผู้ใช้
                    </Label>
                    <Input
                      id="name"
                      placeholder="เช่น จอห์น, มารี..."
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="h-9 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white thai-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                      สีประจำตัว
                    </Label>
                    <div className="grid grid-cols-6 gap-2">
                      {DEFAULT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewUserColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-colors ${
                            newUserColor === color
                              ? 'border-gray-800 dark:border-gray-200'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="h-9 px-4 text-sm thai-text"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-sm thai-text"
                  >
                    เพิ่ม
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="font-medium text-sm text-gray-900 dark:text-white thai-text">
                    {user.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit User */}
                  <Dialog
                    open={editingUser?.id === user.id}
                    onOpenChange={open => !open && handleCancelEdit()}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-7 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 thai-text"
                      >
                        แก้ไข
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
                          แก้ไขผู้ใช้
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 thai-text">
                          แก้ไขข้อมูลของ {user.name}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="edit-name"
                            className="text-sm font-medium text-gray-900 dark:text-white thai-text"
                          >
                            ชื่อผู้ใช้
                          </Label>
                          <Input
                            id="edit-name"
                            placeholder="เช่น จอห์น, มารี..."
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                            className="h-9 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white thai-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900 dark:text-white thai-text">
                            สีประจำตัว
                          </Label>
                          <div className="grid grid-cols-6 gap-2">
                            {DEFAULT_COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewUserColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-colors ${
                                  newUserColor === color
                                    ? 'border-gray-800 dark:border-gray-200'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-9 px-4 text-sm thai-text"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          onClick={handleUpdateUser}
                          className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-sm thai-text"
                        >
                          บันทึก
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete User */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 thai-text"
                        disabled={users.length <= 2}
                      >
                        ลบ
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white thai-text">
                          ยืนยันการลบ
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400 thai-text">
                          ลบผู้ใช้ "{user.name}"?
                          การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 px-4 text-sm thai-text">
                          ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-9 px-4 bg-red-500 hover:bg-red-600 text-sm thai-text"
                        >
                          ลบ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {users.length <= 2 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400 thai-text">
                หมายเหตุ: ต้องมีผู้ใช้อย่างน้อย 2 คนในระบบ
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
