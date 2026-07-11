/**
 * Reports Hooks - React Query hooks for reports data
 */

import { useQuery } from '@tanstack/react-query';
import { reportsApi, ReportFilters } from '@/lib/api';

// Query keys
export const reportsKeys = {
  all: ['reports'] as const,
  analytics: (filters?: ReportFilters) => [...reportsKeys.all, 'analytics', filters] as const,
  charts: (filters?: ReportFilters) => [...reportsKeys.all, 'charts', filters] as const,
  monthlyTrends: (filters?: ReportFilters) => [...reportsKeys.all, 'monthly-trends', filters] as const,
  violationTypes: (filters?: ReportFilters) => [...reportsKeys.all, 'violation-types', filters] as const,
  penaltyComparison: (filters?: ReportFilters) => [...reportsKeys.all, 'penalty-comparison', filters] as const,
  caseStatus: (filters?: ReportFilters) => [...reportsKeys.all, 'case-status', filters] as const,
  districtComparison: (filters?: ReportFilters) => [...reportsKeys.all, 'district-comparison', filters] as const,
};

// Hooks
export function useAnalyticsSummary(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.analytics(filters),
    queryFn: async () => {
      const response = await reportsApi.getAnalytics(filters);
      return response.data.data!;
    },
  });
}

export function useChartData(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.charts(filters),
    queryFn: async () => {
      const response = await reportsApi.getChartData(filters);
      return response.data.data!;
    },
  });
}

export function useMonthlyTrends(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.monthlyTrends(filters),
    queryFn: async () => {
      const response = await reportsApi.getMonthlyTrends(filters);
      return response.data.data!;
    },
  });
}

export function useViolationTypes(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.violationTypes(filters),
    queryFn: async () => {
      const response = await reportsApi.getViolationTypes(filters);
      return response.data.data!;
    },
  });
}

export function usePenaltyComparison(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.penaltyComparison(filters),
    queryFn: async () => {
      const response = await reportsApi.getPenaltyComparison(filters);
      return response.data.data!;
    },
  });
}

export function useCaseStatus(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.caseStatus(filters),
    queryFn: async () => {
      const response = await reportsApi.getCaseStatus(filters);
      return response.data.data!;
    },
  });
}

export function useDistrictComparison(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportsKeys.districtComparison(filters),
    queryFn: async () => {
      const response = await reportsApi.getDistrictComparison(filters);
      return response.data.data!;
    },
  });
}
