'use client';

/**
 * Donut/Pie Chart Component - For violation and vessel type distribution
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface DonutChartProps {
  title: string;
  description?: string;
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  isLoading?: boolean;
  className?: string;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  centerLabel?: {
    value: string | number;
    label: string;
  };
}

const DEFAULT_COLORS = [
  '#DC2626', // Red-600
  '#EF4444', // Red-500
  '#F87171', // Red-400
  '#374151', // Gray-700
  '#6B7280', // Gray-500
  '#9CA3AF', // Gray-400
  '#D1D5DB', // Gray-300
];

export function DonutChart({
  title,
  description,
  data,
  isLoading = false,
  className,
  height = 280,
  showLegend = true,
  innerRadius = 60,
  centerLabel,
}: DonutChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full rounded-full mx-auto" style={{ height, width: height }} />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number }; }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;

    const item = payload[0].payload;
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{item.name}</p>
        <div className="text-sm space-y-1">
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

  const renderCustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium">{((entry.value / total) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={innerRadius + 40}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {!showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          {centerLabel && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold">{centerLabel.value}</div>
                <div className="text-xs text-muted-foreground">{centerLabel.label}</div>
              </div>
            </div>
          )}
        </div>

        {showLegend && renderCustomLegend()}
      </CardContent>
    </Card>
  );
}
