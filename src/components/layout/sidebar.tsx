'use client';

/**
 * Sidebar Navigation Component
 */

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Plus,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncInfo } from '@/hooks/use-dashboard';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: ('admin' | 'member' | 'operator' | 'acf' | 'commissioner')[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Cases', href: '/dashboard/cases', icon: ClipboardList, roles: ['admin', 'operator', 'acf', 'commissioner'] },
  { title: 'New Case', href: '/dashboard/cases/new', icon: Plus, roles: ['admin', 'operator'] },
  { title: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { title: 'Sync Status', href: '/dashboard/sync', icon: RefreshCw },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: syncInfo } = useSyncInfo();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-3 border-b border-border",
          isCollapsed ? "h-16 py-2" : "h-20 py-3"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Fisheries Department Logo"
              width={isCollapsed ? 44 : 48}
              height={isCollapsed ? 44 : 48}
              className="object-contain rounded-lg flex-shrink-0"
              priority
            />
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-gray-800">Department of Fisheries</span>
                <span className="text-xs text-gray-500">Government of Maharashtra</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              // Check if this is the active route
              // Exact match OR starts with href but no other nav item is a better match
              const isExactMatch = pathname === item.href;
              const isChildRoute = item.href !== '/dashboard' && pathname.startsWith(item.href + '/');
              // Don't highlight parent if a more specific nav item matches
              const hasMoreSpecificMatch = filteredNavItems.some(
                (other) => other.href !== item.href &&
                           other.href.startsWith(item.href) &&
                           (pathname === other.href || pathname.startsWith(other.href + '/'))
              );
              const isActive = isExactMatch || (isChildRoute && !hasMoreSpecificMatch);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-red-600 text-white shadow-md hover:bg-red-700'
                        : 'hover:bg-accent hover:text-accent-foreground',
                      isCollapsed && 'justify-center px-0'
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                    {!isCollapsed && (
                      <span className={cn('text-sm', isActive ? 'font-semibold' : 'font-medium')}>{item.title}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sync Status */}
        {!isCollapsed && syncInfo?.lastBatch && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span>
                Last sync:{' '}
                {syncInfo.lastBatch.completedAt
                  ? formatDistanceToNow(new Date(syncInfo.lastBatch.completedAt), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* User Profile */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer',
                  'hover:bg-accent active:scale-[0.98] active:bg-accent/80',
                  isCollapsed && 'justify-center'
                )}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {user ? getInitials(user.fullName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-medium truncate">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                      {user?.role === 'acf' ? 'ACF' : user?.role}
                    </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email || user?.userId}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
