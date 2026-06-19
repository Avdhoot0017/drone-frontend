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
  Upload,
  X,
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
import { useFilterOptions } from '@/hooks/use-dashboard';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { data: users, isLoading } = useUsers();
  const { data: filterOptions } = useFilterOptions();
  const createUser = useCreateUser();
  const resetPassword = useResetPassword();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  // Get enforcement areas (districts) list
  const districts = filterOptions?.enforcementAreas || [];

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
    enforcementAreaId: '',
  });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null);
  const [privateKeyPassword, setPrivateKeyPassword] = useState('');
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
      enforcementAreaId: '',
    });
    setCertFile(null);
    setPrivateKeyFile(null);
    setPrivateKeyPassword('');
    setFormError(null);
    setUseCustomPassword(false);
  };

  // Handle certificate file selection (.cer, .pem)
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = ['.cer', '.pem'];
      const hasValidExt = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidExt) {
        setFormError('Only .cer and .pem certificate files are allowed');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Certificate file must be less than 5MB');
        return;
      }
      setCertFile(file);
      setFormError(null);
    }
  };

  // Remove certificate file
  const removeCertFile = () => {
    setCertFile(null);
  };

  // Handle private key file selection (.pfx, .p12)
  const handlePrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = ['.pfx', '.p12'];
      const hasValidExt = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidExt) {
        setFormError('Only .pfx and .p12 private key files are allowed');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Private key file must be less than 10MB');
        return;
      }
      setPrivateKeyFile(file);
      setFormError(null);
    }
  };

  // Remove private key file
  const removePrivateKeyFile = () => {
    setPrivateKeyFile(null);
    setPrivateKeyPassword('');
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
    // Email is mandatory for ACF, Operator, and Commissioner roles
    if (['acf', 'operator', 'commissioner'].includes(formData.role) && !formData.email?.trim()) {
      setFormError('Email is required for this role');
      return;
    }
    // District is mandatory for ACF role
    if (formData.role === 'acf' && !formData.enforcementAreaId?.trim()) {
      setFormError('District is required for ACF role');
      return;
    }
    // Both certificate and private key are mandatory for ACF role
    if (formData.role === 'acf' && !certFile) {
      setFormError('Certificate file (.cer or .pem) is required for ACF role');
      return;
    }
    if (formData.role === 'acf' && !privateKeyFile) {
      setFormError('Private key file (.pfx or .p12) is required for ACF role');
      return;
    }
    if (useCustomPassword && !formData.password?.trim()) {
      setFormError('Password is required when using custom password');
      return;
    }

    try {
      const dataToSend: CreateUserInput = {
        ...formData,
        password: useCustomPassword && formData.password?.trim() ? formData.password.trim() : undefined,
        enforcementAreaId: formData.role === 'acf' && formData.enforcementAreaId?.trim() ? formData.enforcementAreaId.trim() : undefined,
        certFile: formData.role === 'acf' && certFile ? certFile : undefined,
        privateKeyFile: formData.role === 'acf' && privateKeyFile ? privateKeyFile : undefined,
        privateKeyPassword: formData.role === 'acf' && privateKeyPassword ? privateKeyPassword : undefined,
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
        const roleColors: Record<string, string> = {
          admin: 'bg-red-100 text-red-700 hover:bg-red-100',
          member: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
          operator: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
          acf: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
          commissioner: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
        };
        const roleLabels: Record<string, string> = {
          admin: 'Admin',
          member: 'Member',
          operator: 'Operator',
          acf: 'ACF',
          commissioner: 'Commissioner',
        };
        return (
          <Badge
            className={cn(
              'font-medium border-0',
              roleColors[role] || 'bg-gray-100 text-gray-700 hover:bg-gray-100'
            )}
          >
            {roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1)}
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
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] bg-white flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-black">Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. {useCustomPassword ? 'Enter a custom password.' : 'Password will be auto-generated.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
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
                Email {['acf', 'operator', 'commissioner'].includes(formData.role)
                  ? <span className="text-red-500">*</span>
                  : <span className="text-gray-400 text-xs font-normal">(optional)</span>
                }
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
                onValueChange={(value) => {
                  handleInputChange('role', value);
                  // Clear enforcementAreaId and certificate files when role changes to non-ACF
                  if (value !== 'acf') {
                    handleInputChange('enforcementAreaId', '');
                    removeCertFile();
                    removePrivateKeyFile();
                  }
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="acf">ACF (Asst. Commissioner)</SelectItem>
                  <SelectItem value="commissioner">Commissioner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* District dropdown - only show for ACF role */}
            {formData.role === 'acf' && (
              <div className="space-y-1.5">
                <Label htmlFor="enforcementAreaId" className="text-gray-700">
                  District <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.enforcementAreaId || ''}
                  onValueChange={(value) => handleInputChange('enforcementAreaId', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Digital Signing Files - only for ACF role */}
            {formData.role === 'acf' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <Label className="text-blue-900 font-medium">
                    Digital Signing Files <span className="text-red-500">*</span>
                  </Label>
                </div>
                <p className="text-xs text-blue-700">
                  Upload both your certificate file and private key for digitally signing case documents.
                </p>

                {/* Certificate File Upload (.cer, .pem) */}
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm">
                    Certificate File <span className="text-red-500">*</span>
                  </Label>
                  {certFile ? (
                    <div className="relative border rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border rounded bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <Key className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {certFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(certFile.size / 1024).toFixed(1)} KB - Certificate
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeCertFile}
                          className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 w-full h-14 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors">
                      <Upload className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600">Upload certificate</span> (.cer, .pem)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".cer,.pem"
                        onChange={handleCertFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Private Key File Upload (.pfx, .p12) */}
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm">
                    Private Key File <span className="text-red-500">*</span>
                  </Label>
                  {privateKeyFile ? (
                    <div className="relative border rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border rounded bg-amber-100 flex-shrink-0 flex items-center justify-center">
                          <Key className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {privateKeyFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(privateKeyFile.size / 1024).toFixed(1)} KB - Private Key
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removePrivateKeyFile}
                          className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 w-full h-14 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer bg-white hover:bg-amber-50 transition-colors">
                      <Upload className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-amber-600">Upload private key</span> (.pfx, .p12)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pfx,.p12"
                        onChange={handlePrivateKeyFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Private Key Password */}
                {privateKeyFile && (
                  <div className="space-y-1.5">
                    <Label htmlFor="privateKeyPassword" className="text-gray-700 text-sm">
                      Private Key Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="privateKeyPassword"
                      type="password"
                      value={privateKeyPassword}
                      onChange={(e) => setPrivateKeyPassword(e.target.value)}
                      placeholder="Enter private key password"
                      className="h-9 bg-white"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2 pt-3 border-t border-gray-200">
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
                <div className="space-y-1.5">
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
                    Min 8 characters with uppercase, lowercase, and number.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0 pt-4 border-t">
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
