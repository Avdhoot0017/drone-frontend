'use client';

/**
 * React Query hooks for Sync operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncApi } from '@/lib/api';

// Fetch sync status with recent batches
export function useSyncStatus() {
  return useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const response = await syncApi.getStatus();
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Fetch sheet information
export function useSheetInfo() {
  return useQuery({
    queryKey: ['sheetInfo'],
    queryFn: async () => {
      const response = await syncApi.getSheetInfo();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch sync configuration
export function useSyncConfig() {
  return useQuery({
    queryKey: ['syncConfig'],
    queryFn: async () => {
      const response = await syncApi.getConfig();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch batch details
export function useBatchDetails(batchId: string | null) {
  return useQuery({
    queryKey: ['batchDetails', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const response = await syncApi.getBatchDetails(batchId);
      return response.data.data;
    },
    enabled: !!batchId,
  });
}

// Run sync mutation
export function useRunSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await syncApi.runSync();
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all sync-related queries
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      queryClient.invalidateQueries({ queryKey: ['syncInfo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
