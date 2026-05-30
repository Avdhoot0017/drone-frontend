'use client';

/**
 * Heatmap Component - For hourly distribution visualization
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  title: string;
  description?: string;
  data: number[][];
  xLabels?: string[];
  yLabels?: string[];
  isLoading?: boolean;
  className?: string;
}

const DEFAULT_X_LABELS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12am' : i === 12 ? '12pm' : i < 12 ? `${i}am` : `${i - 12}pm`
);

const DEFAULT_Y_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Heatmap({
  title,
  description,
  data,
  xLabels = DEFAULT_X_LABELS,
  yLabels = DEFAULT_Y_LABELS,
  isLoading = false,
  className,
}: HeatmapProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-48" />
        </CardContent>
      </Card>
    );
  }

  // Find max value for intensity calculation
  const maxValue = Math.max(...data.flat(), 1);

  // Get color intensity based on value
  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted';
    const intensity = value / maxValue;
    if (intensity < 0.2) return 'bg-red-100 dark:bg-red-950';
    if (intensity < 0.4) return 'bg-red-200 dark:bg-red-900';
    if (intensity < 0.6) return 'bg-red-300 dark:bg-red-800';
    if (intensity < 0.8) return 'bg-red-400 dark:bg-red-700';
    return 'bg-red-500 dark:bg-red-600';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* X-axis labels */}
            <div className="flex ml-12 mb-1">
              {xLabels.filter((_, i) => i % 3 === 0).map((label, i) => (
                <div
                  key={i}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${(100 / (xLabels.length / 3))}%` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {data.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-1">
                  {/* Y-axis label */}
                  <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                    {yLabels[rowIndex]}
                  </div>

                  {/* Cells */}
                  <div className="flex-1 flex gap-0.5">
                    {row.map((value, colIndex) => (
                      <div
                        key={colIndex}
                        className={cn(
                          'flex-1 h-6 rounded-sm transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer',
                          getColor(value)
                        )}
                        title={`${yLabels[rowIndex]} ${xLabels[colIndex]}: ${value} observations`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end mt-4 gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <div className="w-4 h-4 rounded-sm bg-red-100 dark:bg-red-950" />
                <div className="w-4 h-4 rounded-sm bg-red-200 dark:bg-red-900" />
                <div className="w-4 h-4 rounded-sm bg-red-300 dark:bg-red-800" />
                <div className="w-4 h-4 rounded-sm bg-red-400 dark:bg-red-700" />
                <div className="w-4 h-4 rounded-sm bg-red-500 dark:bg-red-600" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
