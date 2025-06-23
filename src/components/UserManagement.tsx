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
    <div className="space-y-6">
      <Card className="shadow-xl border border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900 thai-text">
            👥 จัดการผู้ใช้
          </CardTitle>
          <CardDescription className="text-gray-600 thai-text">
            เพิ่ม แก้ไข หรือลบผู้ใช้ในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Add User Button */}
          <div className="mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-all duration-200 thai-text">
                  ➕ เพิ่มผู้ใช้ใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl shadow-2xl border border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold thai-text">
                    👤 เพิ่มผู้ใช้ใหม่
                  </DialogTitle>
                  <DialogDescription className="thai-text">
                    กรอกข้อมูลผู้ใช้ใหม่ที่ต้องการเพิ่ม
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="thai-text">
                      ชื่อผู้ใช้
                    </Label>
                    <Input
                      id="name"
                      placeholder="เช่น จอห์น, มารี..."
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="thai-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="thai-text">สีประจำตัว</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {DEFAULT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewUserColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                            newUserColor === color
                              ? 'border-gray-800 scale-110 shadow-lg'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="thai-text"
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddUser} className="thai-text">
                    ✅ เพิ่ม
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full shadow-md border-2 border-white"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="font-medium text-lg text-gray-900 thai-text">
                    {user.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
                        className="h-9 px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                      >
                        ✏️ แก้ไข
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl shadow-2xl border border-gray-200">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold thai-text">
                          ✏️ แก้ไขผู้ใช้
                        </DialogTitle>
                        <DialogDescription className="thai-text">
                          แก้ไขข้อมูลของ {user.name}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name" className="thai-text">
                            ชื่อผู้ใช้
                          </Label>
                          <Input
                            id="edit-name"
                            placeholder="เช่น จอห์น, มารี..."
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                            className="thai-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="thai-text">สีประจำตัว</Label>
                          <div className="grid grid-cols-6 gap-2">
                            {DEFAULT_COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => setNewUserColor(color)}
                                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                                  newUserColor === color
                                    ? 'border-gray-800 scale-110 shadow-lg'
                                    : 'border-gray-300 hover:border-gray-500'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="thai-text"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          onClick={handleUpdateUser}
                          className="thai-text"
                        >
                          💾 บันทึก
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
                        className="h-9 px-3 text-sm text-red-600 border-red-200 hover:bg-red-50 shadow-sm hover:shadow-md transition-all duration-200 thai-text"
                        disabled={users.length <= 2}
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
                          คุณต้องการลบผู้ใช้ "{user.name}" หรือไม่?
                          <br />
                          <br />
                          <span className="text-red-600 font-medium">
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้
                            และจะส่งผลต่อข้อมูลรายจ่ายที่เกี่ยวข้อง
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="thai-text">
                          ❌ ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 thai-text"
                        >
                          🗑️ ลบ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {users.length <= 2 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 thai-text">
                💡 หมายเหตุ: ต้องมีผู้ใช้อย่างน้อย 2 คนในระบบ
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
