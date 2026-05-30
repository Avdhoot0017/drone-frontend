'use client';

/**
 * KPI Card Component - Displays key metrics with optional sparkline
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  sparklineData?: number[];
  className?: string;
  variant?: 'default' | 'primary' | 'gradient';
  isLoading?: boolean;
  formatValue?: (value: number) => string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparklineData,
  className,
  variant = 'default',
  isLoading = false,
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 bg-green-50 dark:bg-green-950/50';
    if (trend.value < 0) return 'text-red-600 bg-red-50 dark:bg-red-950/50';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-950/50';
  };

  const chartData = sparklineData?.map((value) => ({ value })) || [];

  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        variant === 'gradient' && 'gradient-primary text-white border-0',
        variant === 'primary' && 'border-primary/20 bg-primary/5',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {icon && (
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    variant === 'gradient'
                      ? 'bg-white/20'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {icon}
                </div>
              )}
              <p
                className={cn(
                  'text-sm font-medium',
                  variant === 'gradient' ? 'text-white/80' : 'text-muted-foreground'
                )}
              >
                {title}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <h3
                className={cn(
                  'text-3xl font-bold tracking-tight animate-count',
                  variant === 'gradient' && 'text-white'
                )}
              >
                {value}
              </h3>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium',
                    variant === 'gradient' ? 'bg-white/20 text-white' : getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {subtitle && (
              <p
                className={cn(
                  'text-sm',
                  variant === 'gradient' ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-24 h-12 ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={variant === 'gradient' ? '#ffffff' : 'hsl(var(--primary))'}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={variant === 'gradient' ? '#ffffff' : 'hsl(var(--primary))'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={variant === 'gradient' ? '#ffffff' : 'hsl(var(--primary))'}
                    strokeWidth={2}
                    fill={`url(#gradient-${title})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>

      {/* Decorative element */}
      {variant === 'gradient' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
      )}
    </Card>
  );
}

// Helper function to format large numbers
export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('en-IN');
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
