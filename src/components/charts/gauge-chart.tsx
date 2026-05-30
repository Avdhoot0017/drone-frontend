'use client';

/**
 * Gauge/Progress Ring Chart - For recovery rate and percentage metrics
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  title: string;
  description?: string;
  value: number;
  maxValue?: number;
  label?: string;
  suffix?: string;
  size?: number;
  strokeWidth?: number;
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
  segments?: Array<{
    value: number;
    label: string;
    color: string;
  }>;
}

export function GaugeChart({
  title,
  description,
  value,
  maxValue = 100,
  label,
  suffix = '%',
  size = 180,
  strokeWidth = 16,
  isLoading = false,
  className,
}: GaugeChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="rounded-full" style={{ width: size, height: size }} />
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Get color based on percentage
  const getColor = () => {
    if (percentage >= 70) return 'stroke-green-500';
    if (percentage >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn('transition-all duration-1000 ease-out', getColor())}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold animate-count">
              {value.toFixed(0)}
              <span className="text-xl text-muted-foreground">{suffix}</span>
            </span>
            {label && (
              <span className="text-sm text-muted-foreground">{label}</span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            )}
          />
          <span className="text-sm text-muted-foreground">
            {percentage >= 70 ? 'Good' : percentage >= 40 ? 'Average' : 'Needs Attention'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progress Bar Component - For comparing multiple values
 */
interface ProgressBarProps {
  title: string;
  description?: string;
  items: Array<{
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
  }>;
  isLoading?: boolean;
  className?: string;
}

export function ProgressBars({
  title,
  description,
  items,
  isLoading = false,
  className,
}: ProgressBarProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {items.map((item, index) => {
          const percentage = (item.value / (item.maxValue || maxVal)) * 100;
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || 'hsl(var(--primary))',
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
