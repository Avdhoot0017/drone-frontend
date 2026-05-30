'use client';

/**
 * Bar Chart Component - For regional and comparative data
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BarChartProps {
  title: string;
  description?: string;
  data: Array<{
    name: string;
    value: number;
    [key: string]: string | number;
  }>;
  dataKey?: string;
  isLoading?: boolean;
  className?: string;
  height?: number;
  horizontal?: boolean;
  showLabels?: boolean;
  colors?: string[];
  gradient?: boolean;
}

const DEFAULT_COLORS = [
  'hsl(0, 72%, 51%)',    // Primary red
  'hsl(0, 72%, 61%)',
  'hsl(0, 72%, 71%)',
  'hsl(0, 0%, 35%)',
  'hsl(0, 0%, 45%)',
  'hsl(0, 0%, 55%)',
];

export function RegionalBarChart({
  title,
  description,
  data,
  dataKey = 'value',
  isLoading = false,
  className,
  height = 300,
  horizontal = false,
  showLabels = true,
  colors = DEFAULT_COLORS,
  gradient = true,
}: BarChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; value: number } }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;

    const item = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-medium text-foreground">{item.value.toLocaleString()}</span>
        </p>
      </div>
    );
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 20, right: 30, left: horizontal ? 80 : 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(0, 72%, 61%)" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={!horizontal}
              vertical={horizontal}
              stroke="hsl(var(--border))"
            />
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={70}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar
              dataKey={dataKey}
              radius={[4, 4, 0, 0]}
              fill={gradient ? 'url(#barGradient)' : undefined}
            >
              {!gradient &&
                data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              {showLabels && (
                <LabelList
                  dataKey={dataKey}
                  position={horizontal ? 'right' : 'top'}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={11}
                  formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value)}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
