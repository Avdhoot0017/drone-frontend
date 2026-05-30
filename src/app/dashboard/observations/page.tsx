'use client';

/**
 * Observations Page - View all drone observation records with filtering
 */

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Eye,
  Filter,
  Download,
  MapPin,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  X,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { useObservations, useFilterOptions } from '@/hooks/use-observations';
import { Observation, ObservationParams } from '@/lib/api';
import { formatCurrency } from '@/components/charts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Status badge colors
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  action_taken: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  disputed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// Table columns definition
const columns: ColumnDef<Observation>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return (
        <div className="flex flex-col">
          <span className="font-medium">{format(date, 'MMM dd, yyyy')}</span>
          <span className="text-xs text-muted-foreground">{row.original.time}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'vesselName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vessel" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue('vesselName')}</span>
        <span className="text-xs text-muted-foreground">{row.original.vesselRegNo}</span>
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
    accessorKey: 'enforcementArea',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Region" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.getValue('enforcementArea')}</span>
        <span className="text-xs text-muted-foreground">{row.original.flyingLocation}</span>
      </div>
    ),
  },
  {
    accessorKey: 'violationType',
    header: 'Violation',
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <span className="text-sm line-clamp-2">{row.getValue('violationType')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'penaltyImposed',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Penalty" />,
    cell: ({ row }) => {
      const imposed = row.getValue('penaltyImposed') as number;
      const recovered = row.original.penaltyRecovered;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{formatCurrency(imposed)}</span>
          {recovered > 0 && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {formatCurrency(recovered)} recovered
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge className={cn('capitalize', statusColors[status] || 'bg-gray-100')}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const obs = row.original;
      return (
        <div className="flex items-center gap-2">
          {obs.latitude && obs.longitude && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          {obs.evidenceUrl && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={obs.evidenceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      );
    },
  },
];

export default function ObservationsPage() {
  const [params, setParams] = useState<ObservationParams>({
    page: 1,
    limit: 20,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ObservationParams>({});

  const { data, isLoading, refetch, isFetching } = useObservations(params);
  const { data: filterOptions, isLoading: filtersLoading } = useFilterOptions();

  // Count active filters
  const activeFilters = Object.entries(params).filter(
    ([key, value]) => value && !['page', 'limit'].includes(key)
  ).length;

  // Apply filters
  const applyFilters = () => {
    setParams({ ...params, ...tempFilters, page: 1 });
    setIsFilterOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setParams({ page: 1, limit: params.limit });
    setTempFilters({});
    setIsFilterOpen(false);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setParams({ ...params, page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Observations
          </h1>
          <p className="text-muted-foreground">
            View and manage all drone observation records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : data?.meta.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pages</p>
            <p className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : data?.meta.totalPages}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Page</p>
            <p className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : data?.meta.page}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Per Page</p>
            <p className="text-2xl font-bold">{params.limit}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search vessel name or reg no..."
                value={params.search || ''}
                onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
              />
            </div>

            {/* Quick Region Filter */}
            <Select
              value={params.enforcementAreaId || 'all'}
              onValueChange={(value) =>
                setParams({
                  ...params,
                  enforcementAreaId: value === 'all' ? undefined : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions?.enforcementAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick Status Filter */}
            <Select
              value={params.status || 'all'}
              onValueChange={(value) =>
                setParams({
                  ...params,
                  status: value === 'all' ? undefined : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filterOptions?.statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Filter observations by multiple criteria
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">From</label>
                        <Input
                          type="date"
                          value={tempFilters.startDate || ''}
                          onChange={(e) =>
                            setTempFilters({ ...tempFilters, startDate: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">To</label>
                        <Input
                          type="date"
                          value={tempFilters.endDate || ''}
                          onChange={(e) =>
                            setTempFilters({ ...tempFilters, endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enforcement Area */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enforcement Area</label>
                    <Select
                      value={tempFilters.enforcementAreaId || ''}
                      onValueChange={(value) =>
                        setTempFilters({ ...tempFilters, enforcementAreaId: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select area..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions?.enforcementAreas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Flying Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Flying Location</label>
                    <Select
                      value={tempFilters.flyingLocationId || ''}
                      onValueChange={(value) =>
                        setTempFilters({ ...tempFilters, flyingLocationId: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions?.flyingLocations
                          .filter(
                            (loc) =>
                              !tempFilters.enforcementAreaId ||
                              loc.enforcementAreaId === tempFilters.enforcementAreaId
                          )
                          .map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Violation Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Violation Type</label>
                    <Select
                      value={tempFilters.violationTypeId || ''}
                      onValueChange={(value) =>
                        setTempFilters({ ...tempFilters, violationTypeId: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select violation..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions?.violationTypes.map((viol) => (
                          <SelectItem key={viol.id} value={viol.id}>
                            {viol.code} - {viol.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={tempFilters.status || ''}
                      onValueChange={(value) =>
                        setTempFilters({ ...tempFilters, status: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions?.statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button onClick={applyFilters}>Apply Filters</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Clear Filters */}
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={data?.data || []}
            searchKey="vesselName"
            searchPlaceholder="Search by vessel name..."
            isLoading={isLoading}
            pageSize={params.limit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
