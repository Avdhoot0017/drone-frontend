'use client';

/**
 * Regional Pie Charts Component - Isolated pie charts for each district
 * Shows professional breakdown of observations and violations per region
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RegionData {
  name: string;
  totalObservations: number;
  penaltyImposed: number;
  penaltyRecovered?: number;
  pendingActions?: number;
  violationBreakdown?: Array<{
    name: string;
    count: number;
  }>;
}

interface RegionalPieChartsProps {
  data: RegionData[];
  isLoading?: boolean;
  className?: string;
}

// Professional color palette for each region
const REGION_COLORS: Record<string, { primary: string; secondary: string; accent: string; bg: string }> = {
  'Raigad': {
    primary: '#DC2626',
    secondary: '#EF4444',
    accent: '#FCA5A5',
    bg: 'bg-red-50 dark:bg-red-950/20',
  },
  'Ratnagiri': {
    primary: '#EA580C',
    secondary: '#F97316',
    accent: '#FDBA74',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
  },
  'Sindhudurg': {
    primary: '#0891B2',
    secondary: '#06B6D4',
    accent: '#67E8F9',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
  'Palghar': {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#C4B5FD',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
  },
  'Thane': {
    primary: '#059669',
    secondary: '#10B981',
    accent: '#6EE7B7',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
};

// Default colors for violation breakdown
const VIOLATION_COLORS = [
  '#DC2626',
  '#F97316',
  '#FBBF24',
  '#84CC16',
  '#06B6D4',
  '#6366F1',
  '#A855F7',
  '#EC4899',
];

function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
}

function RegionPieCard({ region, rank }: { region: RegionData; rank: number }) {
  const colors = REGION_COLORS[region.name] || REGION_COLORS['Raigad'];

  // Create pie data from violation breakdown or simple observation data
  const pieData = region.violationBreakdown && region.violationBreakdown.length > 0
    ? region.violationBreakdown.slice(0, 5).map((v, i) => ({
        name: v.name,
        value: v.count,
        color: VIOLATION_COLORS[i % VIOLATION_COLORS.length],
      }))
    : [
        { name: 'Observations', value: region.totalObservations, color: colors.primary },
      ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const recoveryRate = region.penaltyImposed > 0
    ? Math.round(((region.penaltyRecovered || 0) / region.penaltyImposed) * 100)
    : 0;

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number }; }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;

    const item = payload[0].payload;
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 z-50">
        <p className="font-medium mb-1 text-sm">{item.name}</p>
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">
            Count: <span className="font-medium text-foreground">{item.value.toLocaleString()}</span>
          </p>
          <p className="text-muted-foreground">
            Share: <span className="font-medium text-foreground">{percentage}%</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-300 hover:shadow-lg', colors.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: colors.primary }}
            >
              {rank}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: colors.primary }} />
                {region.name}
              </CardTitle>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            {region.totalObservations} obs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Pie Chart */}
        <div className="h-[140px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: colors.primary }}>
                {region.totalObservations}
              </div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Penalty Imposed</p>
            <p className="text-sm font-semibold" style={{ color: colors.primary }}>
              {formatCurrency(region.penaltyImposed)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Recovery Rate</p>
            <div className="flex items-center justify-center gap-1">
              {recoveryRate >= 70 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : recoveryRate >= 40 ? (
                <Minus className="h-3 w-3 text-yellow-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={cn(
                'text-sm font-semibold',
                recoveryRate >= 70 ? 'text-green-600' : recoveryRate >= 40 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {recoveryRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {region.pendingActions !== undefined && region.pendingActions > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pending Actions</span>
              <Badge variant="destructive" className="text-xs h-5">
                {region.pendingActions}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RegionalPieCharts({
  data,
  isLoading = false,
  className,
}: RegionalPieChartsProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-28 h-28 rounded-full mx-auto" />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Sort by total observations descending for ranking
  const sortedData = [...data].sort((a, b) => b.totalObservations - a.totalObservations);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-semibold">5 Districts</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-sm text-muted-foreground">
          Total Observations: <span className="font-semibold text-foreground">{data.reduce((sum, r) => sum + r.totalObservations, 0).toLocaleString()}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-sm text-muted-foreground">
          Total Penalties: <span className="font-semibold text-foreground">{formatCurrency(data.reduce((sum, r) => sum + r.penaltyImposed, 0))}</span>
        </div>
      </div>

      {/* Pie Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {sortedData.map((region, index) => (
          <RegionPieCard
            key={region.name}
            region={region}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
