'use client';

/**
 * Vessels Page - View and analyze vessel information
 */

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Ship,
  AlertTriangle,
  Flag,
  TrendingUp,
  Eye,
  IndianRupee,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { useTopOffenders, useVesselTypeStats } from '@/hooks/use-dashboard';
import { TopOffender } from '@/lib/api';
import { formatCurrency, ProgressBars, DonutChart } from '@/components/charts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Risk category colors
const riskColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
};

// Table columns definition
const columns: ColumnDef<TopOffender>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vessel" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            row.original.riskCategory === 'high'
              ? 'bg-red-100 dark:bg-red-900/30'
              : row.original.riskCategory === 'medium'
              ? 'bg-yellow-100 dark:bg-yellow-900/30'
              : 'bg-green-100 dark:bg-green-900/30'
          )}
        >
          <Ship
            className={cn(
              'h-5 w-5',
              row.original.riskCategory === 'high'
                ? 'text-red-600'
                : row.original.riskCategory === 'medium'
                ? 'text-yellow-600'
                : 'text-green-600'
            )}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue('name')}</span>
            {row.original.isFlagged && (
              <Flag className="h-4 w-4 text-red-500 fill-red-500" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">{row.original.registrationNumber}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'vesselType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue('vesselType')}
      </Badge>
    ),
  },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
  },
  {
    accessorKey: 'totalViolations',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Violations" />,
    cell: ({ row }) => {
      const count = row.getValue('totalViolations') as number;
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{count}</span>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: 'totalPenalty',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Penalty" />,
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.getValue('totalPenalty'))}</span>
    ),
  },
  {
    accessorKey: 'lastObservedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Seen" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastObservedAt'));
      return (
        <div className="flex flex-col">
          <span className="text-sm">{format(date, 'MMM dd, yyyy')}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'riskCategory',
    header: 'Risk',
    cell: ({ row }) => {
      const risk = row.getValue('riskCategory') as string;
      return (
        <Badge className={cn('gap-1 capitalize border', riskColors[risk])}>
          {risk === 'high' && <AlertTriangle className="h-3 w-3" />}
          {risk}
        </Badge>
      );
    },
  },
];

export default function VesselsPage() {
  const [limit, setLimit] = useState(50);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: vessels, isLoading: vesselsLoading } = useTopOffenders(limit);
  const { data: vesselTypes, isLoading: typesLoading } = useVesselTypeStats();

  // Filter vessels
  const filteredVessels = vessels?.filter((v) => {
    const matchesRisk = riskFilter === 'all' || v.riskCategory === riskFilter;
    const matchesSearch =
      !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  }) || [];

  // Calculate stats
  const stats = {
    total: vessels?.length || 0,
    highRisk: vessels?.filter((v) => v.riskCategory === 'high').length || 0,
    mediumRisk: vessels?.filter((v) => v.riskCategory === 'medium').length || 0,
    lowRisk: vessels?.filter((v) => v.riskCategory === 'low').length || 0,
    flagged: vessels?.filter((v) => v.isFlagged).length || 0,
    totalPenalty: vessels?.reduce((sum, v) => sum + v.totalPenalty, 0) || 0,
  };

  // Format vessel type data for donut chart
  const vesselTypeChartData = vesselTypes?.map((v, i) => ({
    name: v.name,
    value: v.count,
    color: i === 0 ? '#DC2626' : i === 1 ? '#EF4444' : i === 2 ? '#F87171' : undefined,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="h-6 w-6" />
            Vessels
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze vessel activities and violations
          </p>
        </div>
        <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">Show 20 vessels</SelectItem>
            <SelectItem value="50">Show 50 vessels</SelectItem>
            <SelectItem value="100">Show 100 vessels</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Ship className="h-4 w-4" />
              <span className="text-sm">Total Vessels</span>
            </div>
            <p className="text-2xl font-bold">
              {vesselsLoading ? <Skeleton className="h-8 w-12" /> : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">High Risk</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {vesselsLoading ? <Skeleton className="h-8 w-12" /> : stats.highRisk}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Medium Risk</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {vesselsLoading ? <Skeleton className="h-8 w-12" /> : stats.mediumRisk}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Ship className="h-4 w-4" />
              <span className="text-sm">Low Risk</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {vesselsLoading ? <Skeleton className="h-8 w-12" /> : stats.lowRisk}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flag className="h-4 w-4" />
              <span className="text-sm">Flagged</span>
            </div>
            <p className="text-2xl font-bold">
              {vesselsLoading ? <Skeleton className="h-8 w-12" /> : stats.flagged}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">Total Penalty</span>
            </div>
            <p className="text-xl font-bold">
              {vesselsLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(stats.totalPenalty)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Vessels by Type"
          description="Distribution of vessel types"
          data={vesselTypeChartData}
          isLoading={typesLoading}
          centerLabel={
            vesselTypes
              ? {
                  value: vesselTypes.reduce((sum, v) => sum + v.count, 0),
                  label: 'Total',
                }
              : undefined
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
            <CardDescription>Vessel classification by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            {vesselsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      High Risk
                    </span>
                    <span className="font-medium">
                      {stats.highRisk} ({((stats.highRisk / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.highRisk / stats.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Medium Risk
                    </span>
                    <span className="font-medium">
                      {stats.mediumRisk} ({((stats.mediumRisk / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.mediumRisk / stats.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Low Risk
                    </span>
                    <span className="font-medium">
                      {stats.lowRisk} ({((stats.lowRisk / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.lowRisk / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Vessel List</CardTitle>
              <CardDescription>
                Showing {filteredVessels.length} of {vessels?.length || 0} vessels
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vessel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredVessels}
            searchKey="name"
            searchPlaceholder="Search by name..."
            isLoading={vesselsLoading}
            pageSize={20}
          />
        </CardContent>
      </Card>
    </div>
  );
}
