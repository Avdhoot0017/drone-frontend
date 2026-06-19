/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (userId: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(userId, password);
          const { user, token } = response.data.data!;

          // Store token in localStorage for API interceptor
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: string }; status?: number } };
          const rawError = err.response?.data?.error || '';
          const status = err.response?.status;

          // Map technical errors to user-friendly messages
          let errorMessage = 'Login failed. Please try again.';

          if (status === 401 || rawError.toLowerCase().includes('invalid') || rawError.toLowerCase().includes('incorrect')) {
            errorMessage = 'Invalid User ID or Password';
          } else if (status === 404 || rawError.toLowerCase().includes('not found') || rawError.toLowerCase().includes('no user')) {
            errorMessage = 'User not found. Please check your User ID.';
          } else if (status === 403 || rawError.toLowerCase().includes('disabled') || rawError.toLowerCase().includes('inactive')) {
            errorMessage = 'Your account is disabled. Please contact administrator.';
          } else if (status === 429) {
            errorMessage = 'Too many login attempts. Please try again later.';
          } else if (rawError.toLowerCase().includes('network') || rawError.toLowerCase().includes('connect')) {
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }

          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          set({
            user: response.data.data!,
            isLoading: false,
          });
        } catch {
          // Token might be invalid
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
