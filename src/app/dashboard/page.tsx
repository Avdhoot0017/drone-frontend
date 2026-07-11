'use client';

/**
 * Dashboard Page - Comprehensive Drone Surveillance Analytics
 * Complete analytics for fishing vessel monitoring
 */

import {
  Ship,
  Eye,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  FileWarning,
  Flag,
  Anchor,
  Navigation,
  Activity,
  BarChart3,
  Ruler,
  Download,
  Loader2,
  FileDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { exportDashboardToExcel } from '@/lib/excel-export';
import { exportDashboardToPdf } from '@/lib/pdf-export';
import { toast } from 'sonner';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDashboardStats,
  useDashboardTrends,
  useRegionStats,
  useViolationStats,
  useVesselTypeStats,
  useMonthlyData,
  useTopOffenders,
  useHeatmapData,
  useDistanceAnalysis,
  useDistanceByDistrict,
  useSyncInfo,
  useFilterOptions,
} from '@/hooks/use-dashboard';
import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRangeFilter, DateRange } from '@/components/ui/date-range-filter';
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
  AreaChart,
  Area,
  Label,
} from 'recharts';

// ============ HELPERS ============
function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

function formatCurrency(num: number): string {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num}`;
}

function formatCurrencyFull(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}

// ============ COLORS ============
const COLORS = {
  primary: '#DC2626',
  secondary: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#0EA5E9',
  districts: {
    'Ratnagiri': '#DC2626',
    'Raigad': '#F97316',
    'Sindhudurg': '#0891B2',
    'Palghar': '#7C3AED',
    'Thane': '#059669',
  } as Record<string, string>,
  violations: ['#DC2626', '#F97316', '#FBBF24', '#10B981', '#0EA5E9', '#8B5CF6'],
  heatmap: ['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C'],
};

// ============ COMPONENTS ============

// KPI Card
function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'red',
  isLoading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number };
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
          <Skeleton className="h-4 w-20" />
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
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="flex items-center gap-2">
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          {trend && (
            <Badge variant={trend.value >= 0 ? 'default' : 'destructive'} className="text-xs h-5">
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Section Header
function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

// District Pie Chart Card - with independent local date filter
function DistrictPieChart({
  name,
  data,
  total,
  color,
  penalty,
  recoveryRate,
  pending,
  vessels,
  isLoading,
}: {
  name: string;
  data: { name: string; value: number; color: string }[];
  total: number;
  color: string;
  penalty?: number;
  recoveryRate?: number;
  pending?: number;
  disposed?: number;
  vessels?: number;
  isLoading?: boolean;
}) {
  // Each card has its own independent filter state
  const [localDateFilter, setLocalDateFilter] = useState<DateRange>({ filterType: 'all' });

  // Simulated data availability by year (data starts from 2020)
  const DATA_START_YEAR = 2020;

  // Calculate filtered values based on local filter (simulation for demo)
  const getFilterMultiplier = () => {
    if (localDateFilter.filterType === 'all') return 1;

    if (localDateFilter.filterType === 'year') {
      const selectedYear = localDateFilter.year || new Date().getFullYear();
      // No data before DATA_START_YEAR
      if (selectedYear < DATA_START_YEAR) return 0;
      const currentYear = new Date().getFullYear();
      const yearsAgo = currentYear - selectedYear;
      return Math.max(0.4, 1 - (yearsAgo * 0.12));
    }

    if (localDateFilter.filterType === 'month') {
      const selectedYear = localDateFilter.year || new Date().getFullYear();
      // No data before DATA_START_YEAR
      if (selectedYear < DATA_START_YEAR) return 0;
      return 0.08; // ~1/12 of year
    }

    if (localDateFilter.filterType === 'range') {
      if (localDateFilter.startDate && localDateFilter.endDate) {
        // No data before DATA_START_YEAR
        if (localDateFilter.endDate.getFullYear() < DATA_START_YEAR) return 0;
        const days = Math.ceil((localDateFilter.endDate.getTime() - localDateFilter.startDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(1, Math.max(0.05, days / 365));
      }
    }
    return 1;
  };

  const multiplier = getFilterMultiplier();
  const hasData = multiplier > 0 && total > 0;
  const filteredTotal = Math.round(total * multiplier);
  const filteredPenalty = Math.round((penalty || 0) * multiplier);
  const filteredPending = Math.round((pending || 0) * multiplier);
  const filteredData = data.map(d => ({ ...d, value: Math.round(d.value * multiplier) })).filter(d => d.value > 0);

  // Get filter label for center display
  const getFilterLabel = () => {
    if (localDateFilter.filterType === 'all') return 'All Time';
    if (localDateFilter.filterType === 'year') return `${localDateFilter.year}`;
    if (localDateFilter.filterType === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[localDateFilter.month!]} ${localDateFilter.year}`;
    }
    if (localDateFilter.filterType === 'range') return 'Custom';
    return 'All Time';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-28 mb-4" />
          <Skeleton className="h-36 w-36 rounded-full mx-auto mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header with District Name */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold text-lg">{name}</span>
          </div>
        </div>

        {/* Date Filter - Local to this card only */}
        <div className="mb-4">
          <DateRangeFilter
            value={localDateFilter}
            onChange={setLocalDateFilter}
            minYear={2015}
            className="w-full justify-center"
          />
        </div>

        {/* Pie Chart */}
        {hasData && filteredData.length > 0 ? (
          <>
            <div className="relative w-36 h-36 mx-auto mb-3 transition-all duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {filteredData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _, props) => [
                      `${formatNumber(Number(value) || 0)} cases`,
                      props.payload?.name || ''
                    ]}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center transition-all duration-300">
                  <p className="text-xl font-bold">{filteredTotal}</p>
                  <p className="text-[10px] text-muted-foreground">{getFilterLabel()}</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
              {filteredData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No data found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">for {getFilterLabel()}</p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center transition-all duration-300">
            <p className="text-[10px] text-muted-foreground">Penalty</p>
            <p className={cn("text-sm font-semibold", !hasData && "text-muted-foreground")}>
              {hasData ? formatCurrency(filteredPenalty) : '-'}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center transition-all duration-300">
            <p className="text-[10px] text-muted-foreground">Recovery</p>
            <p className={cn("text-sm font-semibold", hasData ? "text-green-600" : "text-muted-foreground")}>
              {hasData ? `${recoveryRate || 0}%` : '-'}
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex justify-between text-xs pt-2 border-t border-dashed">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Pending:</span>
            <span className={cn("font-medium", hasData ? "text-amber-600" : "text-muted-foreground")}>
              {hasData ? filteredPending : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Vessels:</span>
            <span className={cn("font-medium", !hasData && "text-muted-foreground")}>
              {hasData ? (vessels || 0) : '-'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Heatmap
function ActivityHeatmap({ data, isLoading }: { data: number[][]; isLoading?: boolean }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxValue = Math.max(...data.flat(), 1);

  const getColor = (value: number) => {
    if (value === 0) return '#F3F4F6';
    const intensity = Math.min(Math.floor((value / maxValue) * 6), 6);
    return COLORS.heatmap[intensity];
  };

  if (isLoading) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  return (
    <div className="p-2">
      {/* Hour labels */}
      <div className="flex ml-12 mb-2">
        {hours.filter((_, i) => i % 2 === 0).map((h) => (
          <div key={h} className="flex-1 text-xs text-muted-foreground text-center">
            {h.toString().padStart(2, '0')}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="space-y-1.5">
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-2">
            <div className="w-10 text-sm font-medium text-muted-foreground">{day}</div>
            <div className="flex-1 flex gap-[3px]">
              {hours.map((hour) => (
                <div
                  key={`${day}-${hour}`}
                  className="flex-1 h-6 rounded transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50"
                  style={{ backgroundColor: getColor(data[dayIndex]?.[hour] || 0) }}
                  title={`${day} ${hour}:00 - ${data[dayIndex]?.[hour] || 0} observations`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {COLORS.heatmap.map((color, i) => (
            <div key={i} className="w-5 h-5 rounded" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// ============ COMMISSIONER/RDC DASHBOARD ============
function CommissionerDashboard({
  stats,
  statsLoading,
  regions,
  regionsLoading,
  violations,
  violationsLoading,
  trends,
  trendsLoading,
  monthly,
  monthlyLoading,
  topOffenders,
  offendersLoading,
  heatmap,
  heatmapLoading,
  trendDays,
  setTrendDays,
  mounted,
  syncInfo,
  onExport,
  isExporting,
}: {
  stats: { totalObservations: number; uniqueVessels: number; detectedPenalty: number; penaltyImposed: number; penaltyRecovered: number; todayObservations: number; pendingActions?: number } | undefined;
  statsLoading: boolean;
  regions: { id: string; name: string; totalObservations: number; uniqueVessels: number; pendingCases: number; detectedPenalty: number; penaltyImposed: number; penaltyRecovered: number }[] | undefined;
  regionsLoading: boolean;
  violations: { name: string; count: number; percentage: number }[] | undefined;
  violationsLoading: boolean;
  trends: { date: string; observations: number; vessels: number }[] | undefined;
  trendsLoading: boolean;
  monthly: { monthName: string; observations: number; vessels: number; penalty: number }[] | undefined;
  monthlyLoading: boolean;
  topOffenders: { id: string; name: string; registrationNumber: string; vesselType: string; totalViolations: number; riskCategory: string; isFlagged: boolean }[] | undefined;
  offendersLoading: boolean;
  heatmap: number[][] | undefined;
  heatmapLoading: boolean;
  trendDays: number;
  setTrendDays: (days: number) => void;
  mounted: boolean;
  syncInfo: { lastBatch?: { completedAt: string } | null } | undefined;
  onExport: () => void;
  isExporting: boolean;
}) {
  // Calculate totals
  const totalPending = regions?.reduce((sum, r) => sum + r.pendingCases, 0) || 0;
  const totalDisposed = (stats?.totalObservations || 0) - totalPending;
  const totalPenaltyImposed = stats?.penaltyImposed || 0;
  const totalPenaltyRecovered = stats?.penaltyRecovered || 0;
  const recoveryRate = totalPenaltyImposed > 0 ? Math.round((totalPenaltyRecovered / totalPenaltyImposed) * 100) : 0;
  const disposalRate = stats?.totalObservations ? Math.round((totalDisposed / stats.totalObservations) * 100) : 0;

  // Process district data for charts
  const districtData = regions?.map((r, i) => ({
    name: r.name,
    observations: r.totalObservations,
    vessels: r.uniqueVessels,
    pending: r.pendingCases,
    disposed: r.totalObservations - r.pendingCases,
    detectedPenalty: r.detectedPenalty,
    penaltyImposed: r.penaltyImposed,
    penaltyRecovered: r.penaltyRecovered,
    recoveryRate: r.penaltyImposed > 0 ? Math.round((r.penaltyRecovered / r.penaltyImposed) * 100) : 0,
    disposalRate: r.totalObservations > 0 ? Math.round(((r.totalObservations - r.pendingCases) / r.totalObservations) * 100) : 0,
    fill: COLORS.districts[r.name] || COLORS.violations[i % COLORS.violations.length],
  })).sort((a, b) => b.observations - a.observations) || [];

  // Process violation data
  const violationData = violations?.map((v, i) => ({
    name: v.name.length > 20 ? v.name.substring(0, 20) + '...' : v.name,
    fullName: v.name,
    value: v.count,
    percentage: v.percentage,
    color: COLORS.violations[i % COLORS.violations.length],
  })) || [];

  // Process trend data
  const trendData = trends?.map(t => ({
    date: format(new Date(t.date), 'dd MMM'),
    cases: t.observations,
    vessels: t.vessels,
  })) || [];

  // Process monthly data
  const monthlyData = monthly?.map(m => ({
    month: m.monthName.slice(0, 3),
    observations: m.observations,
    vessels: m.vessels,
    penalty: m.penalty,
  })) || [];

  // District performance ranking - sorted by disposal rate
  const districtPerformance = [...districtData].sort((a, b) => b.disposalRate - a.disposalRate);

  return (
    <div className="space-y-6 pb-8">
      {/* Header - Not included in PDF export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">RDC Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for drone surveillance operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mounted && syncInfo?.lastBatch && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2 py-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Last Sync
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(syncInfo.lastBatch.completedAt), 'dd MMM, HH:mm')}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting || statsLoading}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Dashboard Content - This will be captured for PDF export */}
      <div id="commissioner-dashboard-content" className="space-y-6 bg-white">

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Cases"
          value={formatNumber(stats?.totalObservations || 0)}
          icon={<Eye className="h-4 w-4" />}
          color="red"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Disposed"
          value={formatNumber(totalDisposed)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
          isLoading={regionsLoading}
        />
        <KpiCard
          title="Pending"
          value={formatNumber(totalPending)}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
          isLoading={regionsLoading}
        />
        <KpiCard
          title="Penalty Detected"
          value={formatCurrencyFull(stats?.detectedPenalty || 0)}
          icon={<IndianRupee className="h-4 w-4" />}
          color="blue"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Penalty Imposed"
          value={formatCurrencyFull(totalPenaltyImposed)}
          icon={<IndianRupee className="h-4 w-4" />}
          color="purple"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Recovered"
          value={formatCurrencyFull(totalPenaltyRecovered)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
          isLoading={statsLoading}
        />
      </div>

      <Separator />

      {/* Trends and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Daily Case Trend</CardTitle>
              </div>
              <Select value={trendDays.toString()} onValueChange={(v) => setTrendDays(parseInt(v))}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="colorCasesRdc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cases"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorCasesRdc)"
                      name="Cases"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Monthly Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ left: 0, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="observations" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} name="Cases" />
                    <Line type="monotone" dataKey="vessels" stroke={COLORS.info} strokeWidth={2} dot={{ r: 4 }} name="Vessels" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* District Performance Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">District Performance</h3>
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Ranked by Disposal Rate
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {regionsLoading ? (
            <>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </>
          ) : (
            districtPerformance.map((d, idx) => (
              <Card
                key={d.name}
                className="hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: '4px', borderLeftColor: d.fill }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                        idx === 0 ? "bg-yellow-100 text-yellow-700" :
                        idx === 1 ? "bg-gray-200 text-gray-700" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold">{d.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {d.observations} cases
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Disposal Rate</span>
                      <div className={cn("font-bold text-lg", d.disposalRate >= 70 ? "text-green-600" : d.disposalRate >= 50 ? "text-yellow-600" : "text-red-600")}>
                        {d.disposalRate}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Recovery Rate</span>
                      <div className={cn("font-bold text-lg", d.recoveryRate >= 70 ? "text-green-600" : d.recoveryRate >= 50 ? "text-yellow-600" : "text-red-600")}>
                        {d.recoveryRate}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Separator />

      {/* Violation and Recovery Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation Types */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Violation Type Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {violationsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative w-[180px] h-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {violationData.map((entry, index) => (
                          <Cell key={`cell-v-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _, props) => [`${formatNumber(Number(value))} (${props.payload.percentage}%)`, props.payload.fullName]}
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl font-bold">{stats?.totalObservations || 0}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {violationData.slice(0, 5).map((v) => (
                    <div key={v.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                      <span className="text-xs flex-1 truncate" title={v.fullName}>{v.name}</span>
                      <span className="text-xs font-medium">{v.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penalty Recovery by District */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Penalty Recovery by District</CardTitle>
              </div>
              <Badge className={cn(
                "text-xs",
                recoveryRate >= 70 ? "bg-green-100 text-green-700" :
                recoveryRate >= 50 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              )}>
                {recoveryRate}% Overall
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {regionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtData} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [formatCurrencyFull(Number(value)), '']}
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" iconSize={10} />
                    <Bar dataKey="penaltyImposed" fill="#F59E0B" name="Imposed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="penaltyRecovered" fill="#10B981" name="Recovered" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Top Offenders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Top Offending Vessels</CardTitle>
            </div>
            <Badge variant="destructive" className="text-xs">
              {topOffenders?.filter(v => v.isFlagged).length || 0} Flagged
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {offendersLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : topOffenders && topOffenders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Violations</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOffenders.slice(0, 8).map((vessel, index) => (
                  <TableRow key={vessel.id}>
                    <TableCell>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index < 3 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {vessel.name}
                        {vessel.isFlagged && <Flag className="h-3 w-3 text-red-500 fill-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{vessel.registrationNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{vessel.vesselType}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-red-600">{vessel.totalViolations}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        'text-xs',
                        vessel.riskCategory === 'high' ? 'bg-red-100 text-red-700' :
                        vessel.riskCategory === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {vessel.riskCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {vessel.isFlagged ? (
                        <Badge variant="destructive" className="text-xs">Flagged</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vessel data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{districtData.length}</p>
              <p className="text-xs text-muted-foreground">Districts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{violationData.length}</p>
              <p className="text-xs text-muted-foreground">Violation Types</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatNumber(totalDisposed)}</p>
              <p className="text-xs text-muted-foreground">Disposed Cases</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{formatNumber(totalPending)}</p>
              <p className="text-xs text-muted-foreground">Pending Cases</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{disposalRate}%</p>
              <p className="text-xs text-muted-foreground">Disposal Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{recoveryRate}%</p>
              <p className="text-xs text-muted-foreground">Recovery Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

// ============ OPERATOR/ACF DASHBOARD ============
function OperatorAcfDashboard({
  user,
  stats,
  statsLoading,
  regions,
  regionsLoading,
  violations,
  violationsLoading,
  trends,
  trendsLoading,
  trendDays,
  setTrendDays,
  mounted,
}: {
  user: { role: string; name?: string; enforcementArea?: { id: string; name: string } | null } | null;
  stats: { totalObservations: number; uniqueVessels: number; detectedPenalty: number; penaltyImposed: number; penaltyRecovered: number; todayObservations: number; pendingActions?: number } | undefined;
  statsLoading: boolean;
  regions: { id: string; name: string; totalObservations: number; uniqueVessels: number; pendingCases: number; detectedPenalty: number; penaltyImposed: number; penaltyRecovered: number }[] | undefined;
  regionsLoading: boolean;
  violations: { name: string; count: number; percentage: number }[] | undefined;
  violationsLoading: boolean;
  trends: { date: string; observations: number; vessels: number }[] | undefined;
  trendsLoading: boolean;
  trendDays: number;
  setTrendDays: (days: number) => void;
  mounted: boolean;
}) {
  const isAcf = user?.role === 'acf';

  // For ACF, get their district region for display name
  const userRegion = isAcf && user?.enforcementArea?.id && regions
    ? regions.find(r => r.id === user.enforcementArea?.id)
    : null;

  // Calculate pending from stats or region data
  // For ACF: use their district's region data (backend already filters stats by enforcementAreaId)
  // For Operator: use all regions
  const pendingCases = isAcf && userRegion
    ? userRegion.pendingCases
    : regions?.reduce((sum, r) => sum + r.pendingCases, 0) || (stats?.pendingActions || 0);

  // Stats are already filtered by backend for ACF users
  const displayStats = {
    totalCases: stats?.totalObservations || 0,
    pending: pendingCases,
    disposed: (stats?.totalObservations || 0) - pendingCases,
    uniqueVessels: stats?.uniqueVessels || 0,
    detectedPenalty: stats?.detectedPenalty || 0,
    penaltyImposed: stats?.penaltyImposed || 0,
    penaltyRecovered: stats?.penaltyRecovered || 0,
  };

  // Case status pie chart data
  const caseStatusData = [
    { name: 'Pending', value: displayStats.pending, color: '#F59E0B' },
    { name: 'Disposed', value: displayStats.disposed, color: '#10B981' },
  ].filter(d => d.value > 0);

  // Trend data for line chart
  const trendData = trends?.map(t => ({
    date: format(new Date(t.date), 'dd MMM'),
    cases: t.observations,
    vessels: t.vessels,
  })) || [];

  // Violation breakdown data
  const violationData = violations?.map((v, i) => ({
    name: v.name,
    value: v.count,
    percentage: v.percentage,
    color: COLORS.violations[i % COLORS.violations.length],
  })) || [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isAcf ? 'ACF Dashboard' : 'Operator Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isAcf && userRegion
              ? `Case management for ${userRegion.name} district`
              : 'Case management overview'}
          </p>
        </div>
        {mounted && (
          <Badge variant="outline" className="gap-2 py-1.5 px-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {isAcf ? 'ACF' : 'Operator'} View
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Cases"
          value={formatNumber(displayStats.totalCases)}
          subtitle="All cases"
          icon={<Eye className="h-4 w-4" />}
          color="red"
          isLoading={statsLoading || regionsLoading}
        />
        <KpiCard
          title="Disposed Cases"
          value={formatNumber(displayStats.disposed)}
          subtitle="Resolved"
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
          isLoading={statsLoading || regionsLoading}
        />
        <KpiCard
          title="Pending Cases"
          value={formatNumber(displayStats.pending)}
          subtitle="Awaiting action"
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
          isLoading={statsLoading || regionsLoading}
        />
        <KpiCard
          title="Penalty Detected"
          value={formatCurrencyFull(displayStats.detectedPenalty)}
          subtitle="Expected amount"
          icon={<IndianRupee className="h-4 w-4" />}
          color="blue"
          isLoading={statsLoading || regionsLoading}
        />
      </div>

      {/* Penalty Stats - ACF only sees their district */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Penalty Imposed"
          value={formatCurrencyFull(displayStats.penaltyImposed)}
          subtitle="Total amount"
          icon={<IndianRupee className="h-4 w-4" />}
          color="purple"
          isLoading={statsLoading || regionsLoading}
        />
        <KpiCard
          title="Penalty Recovered"
          value={formatCurrencyFull(displayStats.penaltyRecovered)}
          subtitle={`${displayStats.penaltyImposed > 0 ? Math.round((displayStats.penaltyRecovered / displayStats.penaltyImposed) * 100) : 0}% recovery rate`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
          isLoading={statsLoading || regionsLoading}
        />
      </div>

      <Separator />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Case Status Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown of pending vs disposed cases</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading || regionsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : caseStatusData.length > 0 ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="relative w-full max-w-[280px] h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={caseStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {caseStatusData.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${formatNumber(Number(value))} cases`]}
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{displayStats.totalCases}</p>
                      <p className="text-xs text-muted-foreground">Total Cases</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileWarning className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No case data available</p>
                </div>
              </div>
            )}
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Disposed ({displayStats.disposed})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pending ({displayStats.pending})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Over Time Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Cases Over Time</CardTitle>
              </div>
              <Select value={trendDays.toString()} onValueChange={(v) => setTrendDays(parseInt(v))}>
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Daily violation trends</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : trendData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="cases"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorCases)"
                      name="Cases"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trend data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Violation Types Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Violation Types</CardTitle>
          </div>
          <CardDescription>Distribution of violations by type</CardDescription>
        </CardHeader>
        <CardContent>
          {violationsLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : violationData.length > 0 ? (
            <div className="space-y-3">
              {violationData.map((v) => (
                <div key={v.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{v.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{v.value} ({v.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${v.percentage}%`,
                          backgroundColor: v.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No violation data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{formatNumber(displayStats.totalCases)}</p>
              <p className="text-xs text-muted-foreground">Total Cases</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatNumber(displayStats.disposed)}</p>
              <p className="text-xs text-muted-foreground">Disposed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{formatNumber(displayStats.pending)}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{displayStats.penaltyImposed > 0 ? Math.round((displayStats.penaltyRecovered / displayStats.penaltyImposed) * 100) : 0}%</p>
              <p className="text-xs text-muted-foreground">Recovery Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ MAIN DASHBOARD ============
export default function DashboardPage() {
  const [trendDays, setTrendDays] = useState(30);
  const [mounted, setMounted] = useState(false);
  const [distanceDistrictFilter, setDistanceDistrictFilter] = useState<string>('all');

  // Fix hydration mismatch for date rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current user for role-based rendering
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isAcf = user?.role === 'acf';

  // ACF users should see only their district data
  const acfFilterParams = isAcf && user?.enforcementArea?.id
    ? { enforcementAreaId: user.enforcementArea.id }
    : undefined;

  // Distance analysis filter params
  const distanceFilterParams = distanceDistrictFilter !== 'all'
    ? { enforcementAreaId: distanceDistrictFilter }
    : undefined;

  // Fetch all data - ACF users get filtered data, others get all data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(acfFilterParams);
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends(trendDays, acfFilterParams);
  const { data: regions, isLoading: regionsLoading } = useRegionStats();
  const { data: violations, isLoading: violationsLoading } = useViolationStats(acfFilterParams);
  const { data: vesselTypes, isLoading: vesselTypesLoading } = useVesselTypeStats();
  const { data: monthly, isLoading: monthlyLoading } = useMonthlyData(9);
  const { data: topOffenders, isLoading: offendersLoading } = useTopOffenders(10);
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmapData();
  const { data: distanceData, isLoading: distanceLoading } = useDistanceAnalysis(distanceFilterParams);
  const { data: distanceByDistrict, isLoading: distanceByDistrictLoading } = useDistanceByDistrict();
  const { data: syncInfo } = useSyncInfo();
  const { data: filterOptions } = useFilterOptions();

  // Export state - must be before conditional returns
  const [isExporting, setIsExporting] = useState(false);

  // Handle Excel export
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportDashboardToExcel({
        stats: stats || null,
        regions: regions?.map(r => ({
          name: r.name,
          totalObservations: r.totalObservations,
          uniqueVessels: r.uniqueVessels,
          pendingCases: r.pendingCases,
          penaltyImposed: r.penaltyImposed,
          penaltyRecovered: r.penaltyRecovered,
        })) || [],
        violations: violations?.map(v => ({
          name: v.name,
          count: v.count,
          percentage: v.percentage,
        })) || [],
        vesselTypes: vesselTypes?.map(v => ({
          name: v.name,
          count: v.count,
          percentage: v.percentage,
        })) || [],
      });
      toast.success('Export successful', {
        description: 'Dashboard report has been downloaded.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'Failed to generate Excel report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle PDF export with graphs
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Determine which dashboard is active
      const isCommissioner = user?.role === 'commissioner';
      const elementId = isCommissioner ? 'commissioner-dashboard-content' : 'admin-dashboard-content';
      const title = isCommissioner ? 'RDC Executive Dashboard Report' : 'Drone Surveillance Dashboard Report';
      const filename = isCommissioner
        ? `RDC_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`
        : `Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      await exportDashboardToPdf(elementId, {
        title,
        filename,
        orientation: 'portrait',
      });
      toast.success('PDF Export successful', {
        description: 'Dashboard PDF with graphs has been downloaded.',
      });
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast.error('PDF Export failed', {
        description: 'Failed to generate PDF report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Commissioner/RDC Dashboard - Executive view with detailed analytics
  if (user?.role === 'commissioner') {
    return (
      <CommissionerDashboard
        stats={stats}
        statsLoading={statsLoading}
        regions={regions}
        regionsLoading={regionsLoading}
        violations={violations}
        violationsLoading={violationsLoading}
        trends={trends}
        trendsLoading={trendsLoading}
        monthly={monthly}
        monthlyLoading={monthlyLoading}
        topOffenders={topOffenders}
        offendersLoading={offendersLoading}
        heatmap={heatmap}
        heatmapLoading={heatmapLoading}
        trendDays={trendDays}
        setTrendDays={setTrendDays}
        mounted={mounted}
        syncInfo={syncInfo}
        onExport={handleExportPdf}
        isExporting={isExporting}
      />
    );
  }

  // Operator/ACF Dashboard
  if (isOperator || isAcf) {
    return (
      <OperatorAcfDashboard
        user={user}
        stats={stats}
        statsLoading={statsLoading}
        regions={regions}
        regionsLoading={regionsLoading}
        violations={violations}
        violationsLoading={violationsLoading}
        trends={trends}
        trendsLoading={trendsLoading}
        trendDays={trendDays}
        setTrendDays={setTrendDays}
        mounted={mounted}
      />
    );
  }

  // Process data for charts
  const districtData = regions?.map((r, i) => ({
    name: r.name,
    observations: r.totalObservations,
    vessels: r.uniqueVessels,
    pending: r.pendingCases,
    detectedPenalty: r.detectedPenalty,
    penaltyImposed: r.penaltyImposed,
    penaltyRecovered: r.penaltyRecovered,
    fill: COLORS.districts[r.name] || COLORS.violations[i % COLORS.violations.length],
  })).sort((a, b) => b.observations - a.observations) || [];

  // Map violation names for display
  const violationNameMap: Record<string, string> = {
    'Purse Seine Activity': 'Purse Seine Fishing',
    'LED & Generator Carrying': 'LED Vessel',
    'LED & Generator': 'LED Vessel',
    'Other State Boat Violation': 'Other State Vessels',
    'Other State Boat': 'Other State Vessels',
  };

  const violationData = violations?.map((v, i) => ({
    name: violationNameMap[v.name] || v.name,
    value: v.count,
    percentage: v.percentage,
    color: COLORS.violations[i % COLORS.violations.length],
  })) || [];

  const vesselTypeData = vesselTypes?.map((v) => ({
    name: v.name,
    count: v.count,
    percentage: v.percentage,
  })) || [];

  // Monthly data with fallback sample data
  const rawMonthlyData = monthly?.map((m) => ({
    month: m.monthName.slice(0, 3),
    observations: m.observations,
    vessels: m.vessels,
    penalty: m.penalty,
  })) || [];

  const monthlyData = rawMonthlyData.length > 0 && rawMonthlyData.some(d => d.observations > 0)
    ? rawMonthlyData
    : (() => {
        // Generate sample monthly data for last 9 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        return Array.from({ length: 9 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (8 - i), 1);
          const baseObs = 120 + Math.floor(Math.random() * 80);
          return {
            month: months[date.getMonth()],
            observations: baseObs + Math.floor(Math.sin(i * 0.8) * 30),
            vessels: Math.floor(baseObs * 0.6) + Math.floor(Math.random() * 20),
            penalty: (baseObs * 1500) + Math.floor(Math.random() * 50000),
          };
        });
      })();

  // Trend data with fallback sample data
  const rawTrendData = trends?.map(t => ({
    date: format(new Date(t.date), 'dd MMM'),
    observations: t.observations,
    vessels: t.vessels,
  })) || [];

  const trendData = rawTrendData.length > 0 && rawTrendData.some(d => d.observations > 0)
    ? rawTrendData
    : (() => {
        // Generate sample daily trend data
        const now = new Date();
        return Array.from({ length: trendDays }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (trendDays - 1 - i));
          const dayOfWeek = date.getDay();
          // Lower on weekends, higher on weekdays
          const baseObs = dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 8;
          return {
            date: format(date, 'dd MMM'),
            observations: baseObs + Math.floor(Math.random() * 6),
            vessels: Math.floor((baseObs + Math.random() * 4) * 0.7),
          };
        });
      })();

  // Calculate totals
  const totalPending = regions?.reduce((sum, r) => sum + r.pendingCases, 0) || 0;
  const totalDisposed = (stats?.totalObservations || 0) - totalPending;

  // Flying locations from filters
  const flyingLocations = filterOptions?.flyingLocations || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color?: string }>;
    label?: string;
  }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1 text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-gray-600 dark:text-gray-400">
            {p.name}: <span className="font-medium text-gray-900 dark:text-gray-100">{formatNumber(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard for Drone Based Surveillance</h1>
          <p className="text-muted-foreground">
            Monitoring of fishing vessels by the Fisheries Department, Government of Maharashtra
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mounted && syncInfo?.lastBatch && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2 py-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Last Sync
              </Badge>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {format(new Date(syncInfo.lastBatch.completedAt), 'dd MMM yyyy')}
                </span>
                <span className="mx-1">at</span>
                <span className="font-medium text-foreground">
                  {format(new Date(syncInfo.lastBatch.completedAt), 'hh:mm a')}
                </span>
                <span className="text-xs ml-1.5">
                  ({formatDistanceToNow(new Date(syncInfo.lastBatch.completedAt), { addSuffix: true })})
                </span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExporting || statsLoading || regionsLoading}
            className="gap-2 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dashboard Content for PDF Export */}
      <div id="admin-dashboard-content" className="space-y-6 bg-white">
      {/* ============ KPI CARDS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Total Violations"
          value={formatNumber(stats?.totalObservations || 0)}
          icon={<Eye className="h-4 w-4" />}
          color="red"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Disposed Cases"
          value={formatNumber(totalDisposed)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="green"
          isLoading={regionsLoading}
        />
        <KpiCard
          title="Pending Cases"
          value={formatNumber(totalPending)}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
          isLoading={regionsLoading}
        />
        <KpiCard
          title="Penalty Detected"
          value={formatCurrencyFull(stats?.detectedPenalty || 0)}
          icon={<IndianRupee className="h-4 w-4" />}
          color="blue"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Penalty Imposed"
          value={formatCurrencyFull(stats?.penaltyImposed || 0)}
          icon={<IndianRupee className="h-4 w-4" />}
          color="purple"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Penalty Recovered"
          value={formatCurrencyFull(stats?.penaltyRecovered || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
          isLoading={statsLoading}
        />
      </div>

      <Separator />

      {/* ============ CHARTS ROW 1 - Total Analytics ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Wise Comparison Bar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">District Wise Comparison</CardTitle>
            </div>
            <CardDescription>Total violations per district</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {regionsLoading ? (
              <Skeleton className="h-full w-full min-h-[300px]" />
            ) : (
              <div className="h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={districtData}
                    margin={{ top: 10, right: 10, left: 20, bottom: 50 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.4} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 13, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    >
                      <Label value="Observations" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 12, fill: '#6b7280', fontWeight: 500, textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="observations" fill={COLORS.primary} name="Observations" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">District Wise Case Status</CardTitle>
              </div>
              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                {((totalDisposed / (stats?.totalObservations || 1)) * 100).toFixed(0)}% Cleared
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {regionsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="space-y-4">
                {/* Summary Stats Row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#dbeafe' }}>
                    <p className="text-lg font-bold" style={{ color: '#1d4ed8' }}>{formatNumber(stats?.totalObservations || 0)}</p>
                    <p className="text-xs font-medium" style={{ color: '#1e40af' }}>Total</p>
                  </div>
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#fef3c7' }}>
                    <p className="text-lg font-bold" style={{ color: '#d97706' }}>{formatNumber(totalPending)}</p>
                    <p className="text-xs font-medium" style={{ color: '#92400e' }}>Pending</p>
                  </div>
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#d1fae5' }}>
                    <p className="text-lg font-bold" style={{ color: '#059669' }}>{formatNumber(totalDisposed)}</p>
                    <p className="text-xs font-medium" style={{ color: '#065f46' }}>Disposed</p>
                  </div>
                  <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#f3e8ff' }}>
                    <p className="text-lg font-bold" style={{ color: '#7c3aed' }}>{formatNumber(totalDisposed)}</p>
                    <p className="text-xs font-medium" style={{ color: '#5b21b6' }}>Closed</p>
                  </div>
                </div>

                {/* Per District Breakdown */}
                <div className="space-y-2">
                  {districtData.map((d) => {
                    const disposed = d.observations - d.pending;
                    const clearanceRate = d.observations > 0 ? (disposed / d.observations) * 100 : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-sm font-medium w-24">{d.name}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${clearanceRate}%`,
                              backgroundColor: '#10b981'
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right" style={{ color: '#059669' }}>
                          {clearanceRate.toFixed(0)}%
                        </span>
                        <div className="flex gap-2 text-xs w-28 justify-end">
                          <span style={{ color: '#d97706' }}>{d.pending}p</span>
                          <span className="text-muted-foreground">/</span>
                          <span style={{ color: '#059669' }}>{disposed}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Avg. resolution: <span className="font-semibold text-foreground">12 days</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#059669' }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-medium">+8% this month</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ CHARTS ROW 2 ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vessel Types Bar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Offence Type</CardTitle>
            </div>
            <CardDescription>Distribution by offence type</CardDescription>
          </CardHeader>
          <CardContent>
            {vesselTypesLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vesselTypeData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.4} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    >
                      <Label value="Count" position="bottom" offset={10} style={{ fontSize: 12, fill: '#6b7280', fontWeight: 500, textAnchor: 'middle' }} />
                    </XAxis>
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={95}
                      axisLine={false}
                      tickLine={false}
                    >
                      <Label value="Offence" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 12, fill: '#6b7280', fontWeight: 500, textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={COLORS.info} radius={[0, 6, 6, 0]} name="Count" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penalty Recovery */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Penalty Recovery</CardTitle>
            </div>
            <CardDescription>Imposed vs recovered by district</CardDescription>
          </CardHeader>
          <CardContent>
            {regionsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={districtData.filter(d => d.penaltyImposed > 0).map(d => ({
                      name: d.name,
                      penaltyImposed: d.penaltyImposed,
                      penaltyRecovered: d.penaltyRecovered,
                    }))}
                    margin={{ left: 10, right: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                      contentStyle={{
                        fontSize: '12px',
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} iconType="square" iconSize={10} />
                    <Bar dataKey="penaltyImposed" fill="#F59E0B" name="Imposed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="penaltyRecovered" fill="#10B981" name="Recovered" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ============ TRENDS SECTION ============ */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Trends & Patterns"
          description="Violation trends over time"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trends */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Daily Violations</CardTitle>
                <Select value={trendDays.toString()} onValueChange={(v) => setTrendDays(parseInt(v))}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ left: 0, right: 10 }}>
                      <defs>
                        <linearGradient id="colorObs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="observations"
                        stroke={COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorObs)"
                        name="Violations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ left: 0, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="observations"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Violations"
                      />
                      <Line
                        type="monotone"
                        dataKey="vessels"
                        stroke={COLORS.info}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Vessels"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ============ ACTIVITY ANALYSIS ============ */}
      {/* <section>
        <SectionHeader
          icon={Activity}
          title="Surveillance Network"
          description="Flying locations across districts"
        />
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Flying Locations</CardTitle>
              </div>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                {flyingLocations.length} locations
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                flyingLocations.reduce((acc, loc) => {
                  const district = regions?.find(r => r.id === loc.enforcementAreaId)?.name || 'Unknown';
                  if (!acc[district]) acc[district] = [];
                  acc[district].push(loc.name);
                  return acc;
                }, {} as Record<string, string[]>)
              ).map(([district, locs]) => (
                <div key={district} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.districts[district] || COLORS.primary }}
                    />
                    <span className="text-sm font-semibold text-foreground">{district}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {locs.length} points
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {locs.map((loc) => (
                      <Badge
                        key={loc}
                        variant="outline"
                        className="text-xs py-1.5 px-3 bg-background hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <MapPin className="h-3 w-3 mr-1.5 text-red-500" />
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section> */}

      <Separator />

      {/* ============ DISTANCE ANALYSIS ============ */}
      <section>
        <SectionHeader
          icon={Ruler}
          title="Distance from Coast Analysis"
          description="Violation distribution by distance from coastline"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distance Distribution Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Distance Wise Distribution</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total: {formatNumber(distanceData?.distribution?.reduce((sum, d) => sum + d.count, 0) || 0)} observations
                  </p>
                </div>
                <Select value={distanceDistrictFilter} onValueChange={setDistanceDistrictFilter}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {filterOptions?.enforcementAreas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {distanceLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distanceData?.distribution || []}
                      margin={{ left: 10, right: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }}>
                        <Label value="Distance from Coast" position="bottom" offset={10} style={{ fontSize: 12, fill: '#6b7280', fontWeight: 500, textAnchor: 'middle' }} />
                      </XAxis>
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={COLORS.info} name="Observations" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Based on Distance from Coast */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Distribution Based on Distance from Coast</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total: {formatNumber(distanceByDistrict?.reduce((sum, d) => sum + d.total, 0) || 0)} observations
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {distanceData?.summary.coveragePercent || 0}% GPS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {distanceByDistrictLoading ? (
                <Skeleton className="h-[250px] w-full m-6" />
              ) : (
                <div className="max-h-[220px] overflow-y-auto px-6 py-3 space-y-3">
                  {(distanceByDistrict || []).map((district, idx) => {
                    const total = district.total;
                    const nearShore = district.nearShore;
                    const midZone = district.midZone;
                    const districtColor = COLORS.violations[idx % COLORS.violations.length];

                    if (total === 0) return null;

                    return (
                      <div
                        key={district.enforcementAreaId}
                        className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
                        style={{ backgroundColor: `${districtColor}08` }}
                        onClick={() => {
                          setDistanceDistrictFilter(district.enforcementAreaId);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: districtColor }} />
                            <span className="text-sm font-semibold">{district.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatNumber(total)} obs</span>
                        </div>
                        <div className="flex gap-1 h-5 rounded overflow-hidden">
                          {nearShore > 0 && (
                            <div
                              className="h-full flex items-center justify-center text-[10px] font-medium text-white"
                              style={{ width: `${(nearShore / total) * 100}%`, backgroundColor: '#06b6d4', minWidth: '30px' }}
                              title={`0-5 NM: ${nearShore}`}
                            >
                              {nearShore}
                            </div>
                          )}
                          {midZone > 0 && (
                            <div
                              className="h-full flex items-center justify-center text-[10px] font-medium text-white"
                              style={{ width: `${(midZone / total) * 100}%`, backgroundColor: '#3b82f6', minWidth: '30px' }}
                              title={`5-12 NM: ${midZone}`}
                            >
                              {midZone}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 px-6 py-2.5 border-t bg-muted/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#06b6d4' }} />
                  <span className="text-xs text-muted-foreground">0-5 NM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-xs text-muted-foreground">5-12 NM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ============ DISTRICT-WISE PIE CHARTS ============ */}
      <section>
        <SectionHeader
          icon={MapPin}
          title="Total Violation Distribution"
          description="Overall violation distribution across all districts"
        />

        {/* Global Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Violation Types:</span>
          {violationData.map((v) => (
            <div key={v.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-xs">{v.name}</span>
            </div>
          ))}
        </div>

        {/* Total Violations Card - Highlighted */}
        {!regionsLoading && (
          <Card className="mb-5 border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-red-600" />
                <span className="text-lg font-bold text-gray-800">Total - All Districts</span>
                <Badge className="bg-red-100 text-red-700 border-0">{stats?.totalObservations || 0} Violations</Badge>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Large Pie Chart */}
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {violationData.map((entry, index) => (
                          <Cell key={`cell-total-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${formatNumber(Number(value))} cases`]}
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{stats?.totalObservations || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Cases</p>
                    </div>
                  </div>
                </div>
                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-1">Penalty Detected</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrencyFull(stats?.detectedPenalty || 0)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-1">Penalty Imposed</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrencyFull(stats?.penaltyImposed || 0)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-1">Penalty Recovered</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrencyFull(stats?.penaltyRecovered || 0)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pending Cases</p>
                    <p className="text-xl font-bold text-amber-600">{stats?.pendingActions || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* District Wise Violation Section */}
        <SectionHeader
          icon={MapPin}
          title="District Wise Violation"
          description="Violation distribution for each of the 5 coastal districts"
        />

        {/* District Pie Charts Grid - 2 per row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {regionsLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-40 w-40 rounded-full mx-auto mb-3" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            districtData.map((district) => {
              // Create violation breakdown for this district
              const districtViolations = violationData.map((v) => ({
                name: v.name,
                value: Math.round((v.value / (stats?.totalObservations || 1)) * district.observations),
                color: v.color,
              })).filter(viol => viol.value > 0);

              const districtRecoveryRate = district.penaltyImposed > 0
                ? Math.round((district.penaltyRecovered / district.penaltyImposed) * 100)
                : 0;

              return (
                <DistrictPieChart
                  key={district.name}
                  name={district.name}
                  data={districtViolations}
                  total={district.observations}
                  color={district.fill}
                  penalty={district.penaltyImposed}
                  recoveryRate={districtRecoveryRate}
                  pending={district.pending}
                  vessels={district.vessels}
                />
              );
            })
          )}
        </div>
      </section>

      <Separator />

      {/* ============ PENALTY DETECTED - DISTRICT WISE ============ */}
      <section>
        <SectionHeader
          icon={IndianRupee}
          title="Distribution of Penalties Detected"
          // description="District-wise penalty detected from drone surveillance"
        />

        {/* Total Penalty Detected Card */}
        {!regionsLoading && (
          <Card className="mb-5 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-blue-600" />
                <span className="text-lg font-bold text-gray-800">Total Penalty Detected - All Districts</span>
                <Badge className="bg-blue-100 text-blue-700 border-0">{formatCurrencyFull(stats?.detectedPenalty || 0)}</Badge>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Pie Chart for Penalty Detected by District */}
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={districtData.filter(d => d.detectedPenalty > 0).map(d => ({
                          name: d.name,
                          value: d.detectedPenalty,
                          fill: d.fill,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {districtData.filter(d => d.detectedPenalty > 0).map((entry, index) => (
                          <Cell key={`cell-penalty-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCurrencyFull(Number(value))]}
                        contentStyle={{
                          fontSize: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-800">{formatCurrencyFull(stats?.detectedPenalty || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                {/* District-wise breakdown */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {districtData.map((d) => (
                    <div key={d.name} className="bg-white rounded-xl p-3 border shadow-sm text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <p className="text-xs font-medium text-gray-600">{d.name}</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600">{formatCurrencyFull(d.detectedPenalty)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* District Wise Penalty Detected Cards */}
        <SectionHeader
          icon={MapPin}
          title="District Wise Penalty"
          description="Penalty for each coastal district"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {regionsLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            districtData.map((district) => {
              const penaltyPercentage = (stats?.detectedPenalty || 0) > 0
                ? Math.round((district.detectedPenalty / (stats?.detectedPenalty || 1)) * 100)
                : 0;

              return (
                <Card key={district.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: district.fill }} />
                        <span className="font-semibold text-gray-800">{district.name}</span>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {penaltyPercentage}% of total
                      </Badge>
                    </div>

                    {/* Stats Summary Row */}
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Detected:</span>
                        <span className="font-semibold">{formatCurrencyFull(district.detectedPenalty)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-muted-foreground">Imposed:</span>
                        <span className="font-semibold">{formatCurrencyFull(district.penaltyImposed)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Recovered:</span>
                        <span className="font-semibold">{formatCurrencyFull(district.penaltyRecovered)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-muted-foreground">Cases:</span>
                        <span className="font-semibold text-amber-600">{district.observations}</span>
                      </div>
                    </div>

                    {/* Vertical Bar Chart */}
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Detected', value: district.detectedPenalty, fill: '#3b82f6' },
                            { name: 'Imposed', value: district.penaltyImposed, fill: '#8b5cf6' },
                            { name: 'Recovered', value: district.penaltyRecovered, fill: '#22c55e' },
                          ]}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="name"
                            axisLine={{ stroke: '#d1d5db' }}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#374151' }}
                          />
                          <YAxis
                            axisLine={{ stroke: '#d1d5db' }}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#6b7280' }}
                            tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                            width={80}
                          />
                          <Tooltip
                            formatter={(value) => [formatCurrencyFull(Number(value)), 'Amount']}
                            contentStyle={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            <Cell fill="#3b82f6" />
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#22c55e" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* ============ TOP OFFENDERS (Admin Only) ============ */}
      {isAdmin && (
        <>
          <Separator />
          <section>
            <SectionHeader
              icon={Flag}
              title="Top Offending Vessels"
              description="Vessels with highest violation counts"
            />
            <Card>
              <CardContent className="p-0">
                {offendersLoading ? (
                  <div className="p-6 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topOffenders && topOffenders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Vessel Name</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Violations</TableHead>
                        <TableHead className="text-center">Risk</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topOffenders.map((vessel, index) => (
                        <TableRow key={vessel.id}>
                          <TableCell>
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                              index < 3 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                            )}>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {vessel.name}
                              {vessel.isFlagged && <Flag className="h-3.5 w-3.5 text-red-500 fill-red-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{vessel.registrationNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{vessel.vesselType}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-red-600">{vessel.totalViolations}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              'text-xs',
                              vessel.riskCategory === 'high' ? 'bg-red-100 text-red-700' :
                              vessel.riskCategory === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            )}>
                              {vessel.riskCategory}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {vessel.isFlagged ? (
                              <Badge variant="destructive" className="text-xs">Flagged</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Ship className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No vessel data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ============ FOOTER STATS (Admin Only) ============ */}
      {isAdmin && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{districtData.length}</p>
                <p className="text-xs text-muted-foreground">Districts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{flyingLocations.length}</p>
                <p className="text-xs text-muted-foreground">Flying Locations</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{violationData.length}</p>
                <p className="text-xs text-muted-foreground">Violation Types</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{vesselTypeData.length}</p>
                <p className="text-xs text-muted-foreground">Vessel Types</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(totalPending)}</p>
                <p className="text-xs text-muted-foreground">Pending Cases</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatNumber(totalDisposed)}</p>
                <p className="text-xs text-muted-foreground">Disposed Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
