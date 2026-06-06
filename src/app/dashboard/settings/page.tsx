'use client';

/**
 * Settings Page - User profile and preferences
 */

import { useState } from 'react';
import {
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { user, fetchProfile } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handlePasswordChange = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      fetchProfile();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setPasswordMessage({
        type: 'error',
        text: axiosError.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-20 w-20 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </div>
                <h2 className="text-xl font-semibold text-black">
                  {user?.fullName || 'User'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {user?.designation || 'System User'}
                </p>
                <Badge
                  className={cn(
                    'mt-3 px-3 py-1 font-medium border-0',
                    user?.role === 'admin'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                </Badge>
              </div>

              <Separator className="my-5" />

              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{user?.email || 'Not configured'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{user?.phone || 'Not configured'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    {user?.enforcementArea?.name || (user?.canViewAllAreas ? 'All Areas' : 'Not assigned')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Joined {user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Last login {user?.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd MMM, HH:mm') : 'Never'}
                  </span>
                </div>
              </div>

              <Separator className="my-5" />

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <Badge
                  className={cn(
                    'px-3 py-1 font-medium border-0',
                    user?.status === 'active'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  )}
                >
                  {user?.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password - Admin Only */}
          {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">Change Password</CardTitle>
              </div>
              <CardDescription>
                Keep your account secure by updating your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                {passwordMessage && (
                  <div
                    className={cn(
                      'p-4 rounded-lg flex items-center gap-3',
                      passwordMessage.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    )}
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{passwordMessage.text}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="Enter current password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                        className="pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Minimum 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
          )}

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive alerts via email</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">System Alerts</p>
                  <p className="text-xs text-gray-500">Sync and system notifications</p>
                </div>
                <Switch disabled />
              </div>
              <p className="text-xs text-gray-400 text-center pt-1">Coming soon</p>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Permissions</CardTitle>
              </div>
              <CardDescription>
                Your access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'View Dashboard', enabled: true },
                  { label: 'View Observations', enabled: true },
                  { label: 'View Vessels', enabled: true },
                  { label: 'Manage Users', enabled: user?.role === 'admin' },
                  { label: 'Manual Sync', enabled: user?.role === 'admin' },
                  { label: 'System Settings', enabled: user?.role === 'admin' },
                ].map((permission, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border',
                      permission.enabled
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        permission.enabled
                          ? 'text-green-600'
                          : 'text-gray-300'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm',
                        permission.enabled
                          ? 'text-green-700'
                          : 'text-gray-400'
                      )}
                    >
                      {permission.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
