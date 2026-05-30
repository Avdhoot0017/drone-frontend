/**
 * Dashboard Hooks - React Query hooks for dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, FilterParams, ObservationParams } from '@/lib/api';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (filters?: FilterParams) => [...dashboardKeys.all, 'stats', filters] as const,
  trends: (days: number, filters?: FilterParams) => [...dashboardKeys.all, 'trends', days, filters] as const,
  regions: (filters?: FilterParams) => [...dashboardKeys.all, 'regions', filters] as const,
  violations: (filters?: FilterParams) => [...dashboardKeys.all, 'violations', filters] as const,
  vesselTypes: (filters?: FilterParams) => [...dashboardKeys.all, 'vessel-types', filters] as const,
  monthly: (months: number) => [...dashboardKeys.all, 'monthly', months] as const,
  topOffenders: (limit: number) => [...dashboardKeys.all, 'top-offenders', limit] as const,
  observations: (params: ObservationParams) => [...dashboardKeys.all, 'observations', params] as const,
  heatmap: (filters?: FilterParams) => [...dashboardKeys.all, 'heatmap', filters] as const,
  distance: (filters?: FilterParams) => [...dashboardKeys.all, 'distance', filters] as const,
  syncInfo: () => [...dashboardKeys.all, 'sync-info'] as const,
  filters: () => [...dashboardKeys.all, 'filters'] as const,
};

// Hooks
export function useDashboardStats(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.stats(filters),
    queryFn: async () => {
      const response = await dashboardApi.getStats(filters);
      return response.data.data!;
    },
  });
}

export function useDashboardTrends(days: number = 30, filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.trends(days, filters),
    queryFn: async () => {
      const response = await dashboardApi.getTrends(days, filters);
      return response.data.data!;
    },
  });
}

export function useRegionStats(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.regions(filters),
    queryFn: async () => {
      const response = await dashboardApi.getRegions(filters);
      return response.data.data!;
    },
  });
}

export function useViolationStats(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.violations(filters),
    queryFn: async () => {
      const response = await dashboardApi.getViolations(filters);
      return response.data.data!;
    },
  });
}

export function useVesselTypeStats(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.vesselTypes(filters),
    queryFn: async () => {
      const response = await dashboardApi.getVesselTypes(filters);
      return response.data.data!;
    },
  });
}

export function useMonthlyData(months: number = 6) {
  return useQuery({
    queryKey: dashboardKeys.monthly(months),
    queryFn: async () => {
      const response = await dashboardApi.getMonthly(months);
      return response.data.data!;
    },
  });
}

export function useTopOffenders(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.topOffenders(limit),
    queryFn: async () => {
      const response = await dashboardApi.getTopOffenders(limit);
      return response.data.data!;
    },
  });
}

export function useObservations(params: ObservationParams) {
  return useQuery({
    queryKey: dashboardKeys.observations(params),
    queryFn: async () => {
      const response = await dashboardApi.getObservations(params);
      return response.data;
    },
  });
}

export function useHeatmapData(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.heatmap(filters),
    queryFn: async () => {
      const response = await dashboardApi.getHeatmap(filters);
      return response.data.data!;
    },
  });
}

export function useDistanceAnalysis(filters?: FilterParams) {
  return useQuery({
    queryKey: dashboardKeys.distance(filters),
    queryFn: async () => {
      const response = await dashboardApi.getDistanceAnalysis(filters);
      return response.data.data!;
    },
  });
}

export function useSyncInfo() {
  return useQuery({
    queryKey: dashboardKeys.syncInfo(),
    queryFn: async () => {
      const response = await dashboardApi.getSyncInfo();
      return response.data.data!;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: dashboardKeys.filters(),
    queryFn: async () => {
      const response = await dashboardApi.getFilters();
      return response.data.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
