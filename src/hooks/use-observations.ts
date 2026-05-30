'use client';

/**
 * React Query hooks for Observations data
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, ObservationParams, FilterOptions } from '@/lib/api';

// Fetch observations with filters and pagination
export function useObservations(params: ObservationParams) {
  return useQuery({
    queryKey: ['observations', params],
    queryFn: async () => {
      const response = await dashboardApi.getObservations(params);
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Fetch filter options
export function useFilterOptions() {
  return useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const response = await dashboardApi.getFilters();
      return response.data.data as FilterOptions;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - filters don't change often
  });
}
