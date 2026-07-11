'use client';

/**
 * Reports Page - Analytics and Charts for Case Reports
 */

import { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  Download,
  Calendar,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { exportDashboardToPdf } from '@/lib/pdf-export';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnalyticsSummary,
  useChartData,
} from '@/hooks/use-reports';
import { useFilterOptions } from '@/hooks/use-dashboard';
import { ReportFilters } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ============ HELPERS ============
function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

// Colors for charts
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  'Reported': '#ef4444',
  'Under Review': '#f97316',
  'Action Pending': '#eab308',
  'Action Taken': '#22c55e',
  'Disposed': '#06b6d4',
};

// ============ COMPONENTS ============

// Format currency with full format
function formatCurrencyFull(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}

// KPI Card Component (matching dashboard style)
function KpiCard({
  title,
  value,
  icon,
  color = 'red',
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  isLoading?: boolean;
}) {
  const colorStyles = {
    red: 'border-l-red-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    purple: 'border-l-purple-500',
  };

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="p-6">
          <Skeleton className="h-5 w-28 mb-3" />
          <Skeleton className="h-10 w-24 mb-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-l-4', colorStyles[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Chart Loading Skeleton
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ============ MAIN PAGE COMPONENT ============
export default function ReportsPage() {
  const currentYear = new Date().getFullYear();

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Build filters object
  const filters = useMemo<ReportFilters>(() => {
    const result: ReportFilters = {};

    // Custom date range takes priority
    if (startDate && endDate) {
      result.startDate = startDate;
      result.endDate = endDate;
    } else {
      // Otherwise use year/month
      if (selectedYear) result.year = selectedYear;
      if (selectedMonth) result.month = selectedMonth;
    }

    if (selectedDistrict) {
      result.enforcementAreaId = selectedDistrict;
    }

    return result;
  }, [selectedDistrict, selectedYear, selectedMonth, startDate, endDate]);

  // Fetch filter options
  const { data: filterOptions, isLoading: filtersLoading } = useFilterOptions();

  // Fetch reports data
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(filters);
  const { data: chartData, isLoading: chartsLoading } = useChartData(filters);

  // Generate year options (last 5 years)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Month options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value === 'all' ? undefined : value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value === 'all' ? undefined : parseInt(value));
    // Clear date range when year is selected
    if (value !== 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value === 'all' ? undefined : parseInt(value));
    // Clear date range when month is selected
    if (value !== 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      // Clear year/month when custom date range is applied
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setDateRangeOpen(false);
    }
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setSelectedYear(currentYear);
    setDateRangeOpen(false);
  };

  const clearFilters = () => {
    setSelectedDistrict(undefined);
    setSelectedYear(currentYear);
    setSelectedMonth(undefined);
    setStartDate('');
    setEndDate('');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDistrict) count++;
    if (selectedMonth) count++;
    if (startDate && endDate) count++;
    return count;
  }, [selectedDistrict, selectedMonth, startDate, endDate]);

  const [isExporting, setIsExporting] = useState(false);

  // Generate PDF title and subtitle based on filters
  const getPdfTitleAndSubtitle = useCallback(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Get district name
    const districtName = selectedDistrict
      ? filterOptions?.enforcementAreas?.find(a => a.id === selectedDistrict)?.name || 'Selected District'
      : null;

    // Build subtitle as a proper sentence
    let subtitle = '';

    if (startDate && endDate) {
      // Custom date range
      const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedEnd = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      if (districtName) {
        subtitle = `Case reports for ${districtName} from ${formattedStart} to ${formattedEnd}`;
      } else {
        subtitle = `Case reports for all districts from ${formattedStart} to ${formattedEnd}`;
      }
    } else if (selectedMonth && selectedYear) {
      // Specific month
      const monthName = monthNames[selectedMonth - 1];
      if (districtName) {
        subtitle = `Case reports for ${districtName} for ${monthName} ${selectedYear}`;
      } else {
        subtitle = `Case reports for all districts for ${monthName} ${selectedYear}`;
      }
    } else if (selectedYear) {
      // Full year
      if (districtName) {
        subtitle = `Case reports for ${districtName} for the year ${selectedYear}`;
      } else {
        subtitle = `Case reports for all districts for the year ${selectedYear}`;
      }
    } else {
      // No date filter
      if (districtName) {
        subtitle = `Case reports for ${districtName}`;
      } else {
        subtitle = `Case reports for all districts`;
      }
    }

    const title = 'Reports & Analytics';

    // Generate filename
    const filenameParts = ['Reports'];
    if (districtName) {
      const shortName = districtName.replace(/\s+/g, '_');
      filenameParts.push(shortName);
    }
    if (startDate && endDate) {
      filenameParts.push(`${startDate}_to_${endDate}`);
    } else if (selectedMonth && selectedYear) {
      filenameParts.push(`${monthNames[selectedMonth - 1]}_${selectedYear}`);
    } else if (selectedYear) {
      filenameParts.push(`${selectedYear}`);
    }
    const filename = `${filenameParts.join('_')}.pdf`;

    return { title, subtitle, filename };
  }, [selectedDistrict, selectedYear, selectedMonth, startDate, endDate, filterOptions?.enforcementAreas]);

  const handleExport = useCallback(async () => {
    if (!analytics && !chartData) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const { title, subtitle, filename } = getPdfTitleAndSubtitle();
      await exportDashboardToPdf('reports-content', {
        title,
        subtitle,
        filename,
        orientation: 'landscape',
      });
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  }, [analytics, chartData, getPdfTitleAndSubtitle]);

  const isLoading = analyticsLoading || chartsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View detailed analytics and generate reports for case data
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || isLoading || (!analytics && !chartData)}
          className="cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Exportable Content */}
      <div id="reports-content" className="space-y-6">

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter reports by district and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* District Filter - First */}
            <div className="w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">District</label>
              <Select
                value={selectedDistrict || 'all'}
                onValueChange={handleDistrictChange}
                disabled={filtersLoading}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Districts</SelectItem>
                  {filterOptions?.enforcementAreas?.map((area) => (
                    <SelectItem key={area.id} value={area.id} className="cursor-pointer">
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="w-[130px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Year</label>
              <Select
                value={selectedYear?.toString() || 'all'}
                onValueChange={handleYearChange}
                disabled={!!(startDate && endDate)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="cursor-pointer">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="w-[140px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Month</label>
              <Select
                value={selectedMonth?.toString() || 'all'}
                onValueChange={handleMonthChange}
                disabled={!!(startDate && endDate)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Months</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value} className="cursor-pointer">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            <div className="w-[220px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Date Range</label>
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex h-9 w-full items-center justify-start gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer overflow-hidden",
                      startDate && endDate
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-background text-foreground"
                    )}
                  >
                    <Calendar className="h-4 w-4 opacity-50 flex-shrink-0" />
                    {startDate && endDate ? (
                      <span className="truncate text-xs">{startDate} - {endDate}</span>
                    ) : (
                      <span className="text-muted-foreground">Custom Range</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 bg-white border shadow-md" align="start">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={endDate || new Date().toISOString().split('T')[0]}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          max={new Date().toISOString().split('T')[0]}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleApplyDateRange}
                        disabled={!startDate || !endDate}
                        className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                      >
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearDateRange}
                        className="cursor-pointer"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground cursor-pointer relative">
                Clear Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Total Violations"
          value={formatNumber(analytics?.totalViolations || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          isLoading={analyticsLoading}
        />
        <KpiCard
          title="Disposed Cases"
          value={formatNumber(analytics?.disposedCases || 0)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
          isLoading={analyticsLoading}
        />
        <KpiCard
          title="Pending Cases"
          value={formatNumber(analytics?.pendingCases || 0)}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
          isLoading={analyticsLoading}
        />
      </div>

      {/* Analytics Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Penalty Detected"
          value={formatCurrencyFull(analytics?.penaltyDetected || 0)}
          icon={<IndianRupee className="h-5 w-5" />}
          color="blue"
          isLoading={analyticsLoading}
        />
        <KpiCard
          title="Penalty Imposed"
          value={formatCurrencyFull(analytics?.penaltyImposed || 0)}
          icon={<IndianRupee className="h-5 w-5" />}
          color="purple"
          isLoading={analyticsLoading}
        />
        <KpiCard
          title="Penalty Recovered"
          value={formatCurrencyFull(analytics?.penaltyRecovered || 0)}
          icon={<IndianRupee className="h-5 w-5" />}
          color="green"
          isLoading={analyticsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trends Line Chart */}
        {chartsLoading ? (
          <ChartSkeleton />
        ) : chartData?.monthlyTrends ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>
                Violations, disposed, and pending cases over the year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="violations"
                    name="Violations"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="disposed"
                    name="Disposed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Violation Type Distribution Bar Chart */}
        {chartsLoading ? (
          <ChartSkeleton />
        ) : chartData?.violationTypes && chartData.violationTypes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Violation Type Distribution</CardTitle>
              <CardDescription>
                Number of cases by violation type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.violationTypes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}...` : value}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value) || 0), 'Cases']}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="count" name="Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Case Status Pie Chart */}
        {chartsLoading ? (
          <ChartSkeleton />
        ) : chartData?.caseStatus && chartData.caseStatus.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Case Status Distribution</CardTitle>
              <CardDescription>
                Current status of all cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.caseStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, payload }) => `${name} (${payload?.percentage || 0}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {chartData.caseStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value) || 0)]}
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

      </div>

      {/* No Data State */}
      {/* No Data State */}
      {!isLoading && !analytics && !chartData && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              There is no data available for the selected filters. Try adjusting your filters.
            </p>
          </div>
        </Card>
      )}

      </div>{/* End of reports-content */}
    </div>
  );
}
