'use client';

/**
 * Users Management Page - Admin only
 * List, add, edit, activate/deactivate, reset password, and delete users
 */

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  UserPlus,
  MoreHorizontal,
  Key,
  UserX,
  UserCheck,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { User, CreateUserInput } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  useUsers,
  useCreateUser,
  useResetPassword,
  useUpdateUserStatus,
  useDeleteUser,
} from '@/hooks/use-users';
import { useAuthStore } from '@/stores/auth.store';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const resetPassword = useResetPassword();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<{ userId: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserInput>({
    userId: '',
    fullName: '',
    role: 'member',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [useCustomResetPassword, setUseCustomResetPassword] = useState(false);

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle form input change
  const handleInputChange = (field: keyof CreateUserInput, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      userId: '',
      fullName: '',
      role: 'member',
      email: '',
      password: '',
    });
    setFormError(null);
    setUseCustomPassword(false);
  };

  // Create user
  const handleCreateUser = async () => {
    if (!formData.userId.trim()) {
      setFormError('User ID is required');
      return;
    }
    if (!formData.fullName.trim()) {
      setFormError('Full Name is required');
      return;
    }
    if (useCustomPassword && !formData.password?.trim()) {
      setFormError('Password is required when using custom password');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        password: useCustomPassword && formData.password?.trim() ? formData.password.trim() : undefined,
      };
      const result = await createUser.mutateAsync(dataToSend);
      setCredentials(result);
      setShowAddDialog(false);
      setShowCredentialsDialog(true);
      resetForm();
      toast.success('User created successfully', {
        description: `User "${formData.fullName}" has been created.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMsg = err.response?.data?.error || 'Failed to create user';
      setFormError(errorMsg);
      toast.error('Failed to create user', {
        description: errorMsg,
      });
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const customPwd = useCustomResetPassword && resetPasswordValue.trim() ? resetPasswordValue.trim() : undefined;
      const result = await resetPassword.mutateAsync({ userId: selectedUser.userId, password: customPwd });
      setCredentials({ userId: selectedUser.userId, password: result.newPassword });
      setShowResetDialog(false);
      setShowCredentialsDialog(true);
      setResetPasswordValue('');
      setUseCustomResetPassword(false);
      toast.success('Password reset successfully', {
        description: `Password for "${selectedUser.fullName}" has been reset.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMsg = err.response?.data?.error || 'Failed to reset password';
      toast.error('Failed to reset password', {
        description: errorMsg,
      });
    }
  };

  // Toggle status
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStatus.mutateAsync({ userId: user.userId, status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`, {
        description: `"${user.fullName}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMsg = err.response?.data?.error || 'Failed to update status';
      toast.error('Failed to update status', {
        description: errorMsg,
      });
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const userName = selectedUser.fullName;
    try {
      await deleteUser.mutateAsync(selectedUser.userId);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.success('User deleted successfully', {
        description: `"${userName}" has been permanently deleted.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMsg = err.response?.data?.error || 'Failed to delete user';
      toast.error('Failed to delete user', {
        description: errorMsg,
      });
    }
  };

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'userId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="User ID" />,
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.getValue('userId')}</span>
      ),
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Full Name" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.getValue('fullName')}</div>
          {row.original.designation && (
            <div className="text-xs text-gray-500">{row.original.designation}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.email && <div className="text-gray-700">{row.original.email}</div>}
          {row.original.phone && <div className="text-gray-500">{row.original.phone}</div>}
          {!row.original.email && !row.original.phone && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge
            className={cn(
              'font-medium border-0',
              role === 'admin'
                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            )}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'enforcementArea',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
      cell: ({ row }) => {
        const user = row.original;
        if (user.canViewAllAreas) {
          return <span className="text-gray-600">All Areas</span>;
        }
        return (
          <span className="text-gray-600">
            {user.enforcementArea?.name || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            className={cn(
              'font-medium border-0',
              status === 'active'
                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                : status === 'inactive'
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => {
        const date = row.getValue('lastLoginAt') as string;
        return date ? (
          <span className="text-sm text-gray-600">
            {format(new Date(date), 'dd MMM yyyy, HH:mm')}
          </span>
        ) : (
          <span className="text-gray-400">Never</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.userId === currentUser?.userId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setShowResetDialog(true);
                }}
                disabled={isCurrentUser}
              >
                <Key className="h-4 w-4 text-orange-500" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleStatus(user)}
                disabled={isCurrentUser}
              >
                {user.status === 'active' ? (
                  <>
                    <UserX className="h-4 w-4 text-gray-500" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-green-500" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                onClick={() => {
                  setSelectedUser(user);
                  setShowDeleteDialog(true);
                }}
                disabled={isCurrentUser}
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their access permissions
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter((u) => u.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <UserX className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter((u) => u.status === 'inactive').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Key className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter((u) => u.role === 'admin').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users || []}
            searchKey="fullName"
            searchPlaceholder="Search by name..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[420px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. {useCustomPassword ? 'Enter a custom password.' : 'Password will be auto-generated.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-700">
                User ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                placeholder="Enter user ID"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter full name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomPassword"
                  checked={useCustomPassword}
                  onChange={(e) => setUseCustomPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <Label htmlFor="useCustomPassword" className="text-gray-700 text-sm font-normal cursor-pointer">
                  Set custom password
                </Label>
              </div>
              {useCustomPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password (min 8 characters)"
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, and number.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUser.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Credentials Generated
            </DialogTitle>
            <DialogDescription>
              Please save these credentials. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="font-mono font-medium text-gray-900">{credentials?.userId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(credentials?.userId || '', 'userId')}
                >
                  {copiedField === 'userId' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Password</p>
                  <p className="font-mono font-medium text-gray-900">{credentials?.password}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(credentials?.password || '', 'password')}
                >
                  {copiedField === 'password' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              User will be prompted to change password on first login
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowCredentialsDialog(false);
                setCredentials(null);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={(open) => {
        setShowResetDialog(open);
        if (!open) {
          setResetPasswordValue('');
          setUseCustomResetPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for{' '}
              <span className="font-medium">{selectedUser?.fullName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                {useCustomResetPassword
                  ? 'Enter a new password for this user.'
                  : 'A new password will be auto-generated.'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomResetPassword"
                  checked={useCustomResetPassword}
                  onChange={(e) => setUseCustomResetPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="useCustomResetPassword" className="text-gray-700 text-sm font-normal cursor-pointer">
                  Set custom password
                </Label>
              </div>
              {useCustomResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="resetPassword" className="text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="resetPassword"
                    type="password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, and number.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setSelectedUser(null);
                setResetPasswordValue('');
                setUseCustomResetPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPassword.isPending || (useCustomResetPassword && !resetPasswordValue.trim())}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">{selectedUser?.fullName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                This action cannot be undone. The user will lose access to the system permanently.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
