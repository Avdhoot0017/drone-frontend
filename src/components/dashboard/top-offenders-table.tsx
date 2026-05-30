'use client';

/**
 * Top Offenders Table - Displays vessels with highest violation counts
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Ship, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/components/charts';
import { TopOffender } from '@/lib/api';

interface TopOffendersTableProps {
  data: TopOffender[];
  isLoading?: boolean;
  className?: string;
}

export function TopOffendersTable({
  data,
  isLoading = false,
  className,
}: TopOffendersTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Top Offenders</CardTitle>
            <CardDescription>Vessels with highest violations</CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Ship className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No offenders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((offender, index) => (
              <div
                key={offender.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-colors',
                  'hover:bg-muted/50 cursor-pointer',
                  index === 0 && 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                )}
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0
                      ? 'bg-red-600 text-white'
                      : index === 1
                      ? 'bg-red-500 text-white'
                      : index === 2
                      ? 'bg-red-400 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>

                {/* Vessel Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{offender.name}</p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {offender.vesselType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {offender.registrationNumber}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="font-semibold">
                    {offender.totalViolations}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      violations
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(offender.totalPenalty)}
                  </p>
                </div>

                {/* Risk Badge */}
                <Badge
                  className={cn(
                    'shrink-0 gap-1',
                    getRiskColor(offender.riskCategory)
                  )}
                >
                  {getRiskIcon(offender.riskCategory)}
                  {offender.riskCategory.charAt(0).toUpperCase() + offender.riskCategory.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
