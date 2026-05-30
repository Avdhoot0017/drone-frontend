'use client';

/**
 * Sync Page - Monitor and control Google Sheets synchronization
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCw,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Play,
  Loader2,
  Info,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSyncStatus, useSheetInfo, useSyncConfig, useRunSync } from '@/hooks/use-sync';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

// Status badge colors - standardized chip styles
const statusColors: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  running: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  partial: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function SyncPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const { data: syncStatus, isLoading: statusLoading, refetch } = useSyncStatus();
  const { data: sheetInfo, isLoading: sheetLoading } = useSheetInfo();
  const { data: syncConfig, isLoading: configLoading } = useSyncConfig();
  const runSync = useRunSync();

  const handleRunSync = async () => {
    try {
      await runSync.mutateAsync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Data Synchronization
          </h1>
          <p className="text-muted-foreground">
            Monitor and control Google Sheets data synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {isAdmin && (
            <Button
              onClick={handleRunSync}
              disabled={runSync.isPending}
              className="gap-2"
            >
              {runSync.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Sync Now
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                {statusLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : syncStatus?.lastSyncAt ? (
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(syncStatus.lastSyncAt), { addSuffix: true })}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Never</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schedule</p>
                {configLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <p className="font-medium">{syncConfig?.syncSchedule || 'Daily 8 PM'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sheet Modified</p>
                {statusLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : syncStatus?.lastModifiedTime ? (
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(syncStatus.lastModifiedTime), { addSuffix: true })}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Unknown</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  syncConfig?.syncEnabled
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                <Database
                  className={cn(
                    'h-5 w-5',
                    syncConfig?.syncEnabled ? 'text-green-600' : 'text-red-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto Sync</p>
                {configLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                      syncConfig?.syncEnabled
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {syncConfig?.syncEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheet Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google Sheet Information
          </CardTitle>
          <CardDescription>Details about the connected data source</CardDescription>
        </CardHeader>
        <CardContent>
          {sheetLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          ) : sheetInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sheet Title</p>
                <p className="font-medium">{sheetInfo.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sheet ID</p>
                <p className="font-mono text-sm">{sheetInfo.sheetId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                <p className="font-medium">
                  {format(new Date(sheetInfo.lastModifiedTime), 'PPpp')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tabs</p>
                <div className="flex flex-wrap gap-2">
                  {sheetInfo.tabs.map((tab) => (
                    <span
                      key={tab}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              <p>Unable to fetch sheet information</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sync Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sync History
          </CardTitle>
          <CardDescription>View past synchronization results</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : syncStatus?.recentBatches && syncStatus.recentBatches.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Started</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Records</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">New</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Duplicates</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Errors</TableHead>
                    <TableHead className="font-semibold text-gray-700">Triggered By</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncStatus.recentBatches.map((batch, index) => {
                    const status = statusColors[batch.status] || statusColors.completed;
                    return (
                      <TableRow
                        key={batch.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        )}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {format(new Date(batch.startedAt), 'MMM dd, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(batch.startedAt), 'HH:mm:ss')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize',
                            status.bg, status.text, status.border
                          )}>
                            {status.icon}
                            {batch.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {batch.durationMs ? formatDuration(batch.durationMs) : '-'}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-900">
                          {batch.totalRowsScanned.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            +{batch.newRecordsAdded}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {batch.duplicateRecords}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {batch.errorRecords > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              {batch.errorRecords}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              0
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200">
                            {batch.triggeredBy}
                          </span>
                        </TableCell>
                        <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-pointer hover:bg-gray-100"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Sync Batch Details</DialogTitle>
                              <DialogDescription>
                                Batch ID: {batch.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Started At</p>
                                  <p className="font-medium">
                                    {format(new Date(batch.startedAt), 'PPpp')}
                                  </p>
                                </div>
                                {batch.completedAt && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Completed At</p>
                                    <p className="font-medium">
                                      {format(new Date(batch.completedAt), 'PPpp')}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Rows</p>
                                  <p className="text-xl font-bold">
                                    {batch.totalRowsScanned.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">New Records</p>
                                  <p className="text-xl font-bold text-green-600">
                                    +{batch.newRecordsAdded}
                                  </p>
                                </div>
                              </div>

                              {batch.errorMessage && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    {batch.errorMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mb-2 opacity-50" />
              <p>No sync history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Result Toast (if just completed) */}
      {runSync.isSuccess && runSync.data && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Sync completed successfully!
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  {runSync.data.newRecords} new records added, {runSync.data.duplicates} duplicates
                  skipped
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {runSync.isError && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Sync failed</p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {(runSync.error as Error)?.message || 'An error occurred during synchronization'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
