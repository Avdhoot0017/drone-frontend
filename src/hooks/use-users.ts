/**
 * Users Hooks - React Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, CreateUserInput } from '@/lib/api';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
};

// Hooks
export function useUsers() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: async () => {
      const response = await authApi.getUsers();
      return response.data.data!;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await authApi.createUser(data);
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password?: string }) => {
      const response = await authApi.resetPassword(userId, password);
      return response.data.data!;
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await authApi.updateUserStatus(userId, status);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authApi.deleteUser(userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}
