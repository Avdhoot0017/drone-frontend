/**
 * API Client for Drone Dashboard Backend
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth APIs
export const authApi = {
  login: (userId: string, password: string) =>
    api.post<ApiResponse<{
      user: User;
      token: string;
      expiresAt: string;
    }>>('/auth/login', { userId, password }),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<void>>('/auth/change-password', { currentPassword, newPassword }),

  getUsers: () =>
    api.get<ApiResponse<User[]>>('/auth/users'),

  createUser: (data: CreateUserInput) =>
    api.post<ApiResponse<{ userId: string; password: string }>>('/auth/users', data),

  resetPassword: (userId: string, password?: string) =>
    api.post<ApiResponse<{ newPassword: string }>>(`/auth/users/${userId}/reset-password`, { password }),

  updateUserStatus: (userId: string, status: string) =>
    api.patch<ApiResponse<void>>(`/auth/users/${userId}/status`, { status }),

  deleteUser: (userId: string) =>
    api.delete<ApiResponse<void>>(`/auth/users/${userId}`),
};

// Dashboard APIs
export const dashboardApi = {
  getStats: (params?: FilterParams) =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats', { params }),

  getTrends: (days: number = 30, params?: FilterParams) =>
    api.get<ApiResponse<TrendData[]>>('/dashboard/trends', { params: { days, ...params } }),

  getRegions: (params?: FilterParams) =>
    api.get<ApiResponse<RegionStats[]>>('/dashboard/regions', { params }),

  getViolations: (params?: FilterParams) =>
    api.get<ApiResponse<ViolationStats[]>>('/dashboard/violations', { params }),

  getVesselTypes: (params?: FilterParams) =>
    api.get<ApiResponse<VesselTypeStats[]>>('/dashboard/vessel-types', { params }),

  getMonthly: (months: number = 6) =>
    api.get<ApiResponse<MonthlyData[]>>('/dashboard/monthly', { params: { months } }),

  getTopOffenders: (limit: number = 10) =>
    api.get<ApiResponse<TopOffender[]>>('/dashboard/top-offenders', { params: { limit } }),

  getObservations: (params: ObservationParams) =>
    api.get<PaginatedResponse<Observation>>('/dashboard/observations', { params }),

  getHeatmap: (params?: FilterParams) =>
    api.get<ApiResponse<number[][]>>('/dashboard/heatmap', { params }),

  getDistanceAnalysis: (params?: FilterParams) =>
    api.get<ApiResponse<DistanceAnalysis>>('/dashboard/distance', { params }),

  getSyncInfo: () =>
    api.get<ApiResponse<SyncInfo>>('/dashboard/sync-info'),

  getFilters: () =>
    api.get<ApiResponse<FilterOptions>>('/dashboard/filters'),
};

// Sync APIs
export const syncApi = {
  runSync: () =>
    api.post<ApiResponse<SyncResult>>('/sync/run'),

  getStatus: () =>
    api.get<ApiResponse<SyncStatus>>('/sync/status'),

  getBatchDetails: (id: string) =>
    api.get<ApiResponse<SyncBatch>>(`/sync/batch/${id}`),

  getSheetInfo: () =>
    api.get<ApiResponse<SheetInfo>>('/sync/sheet-info'),

  getConfig: () =>
    api.get<ApiResponse<SyncConfig>>('/sync/config'),
};

// Types
export interface User {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  designation?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive' | 'suspended';
  enforcementArea?: { id: string; name: string } | null;
  canViewAllAreas: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserInput {
  userId: string;
  fullName: string;
  role: 'admin' | 'member';
  email?: string;
  phone?: string;
  designation?: string;
  enforcementAreaId?: string;
  canViewAllAreas?: boolean;
  password?: string;
}

export interface DashboardStats {
  totalObservations: number;
  uniqueVessels: number;
  pendingActions: number;
  penaltyImposed: number;
  penaltyRecovered: number;
  recoveryRate: number;
  todayObservations: number;
  thisMonthObservations: number;
}

export interface TrendData {
  date: string;
  observations: number;
  vessels: number;
  penaltyImposed: number;
  penaltyRecovered: number;
  [key: string]: string | number;
}

export interface RegionStats {
  id: string;
  name: string;
  totalObservations: number;
  uniqueVessels: number;
  penaltyImposed: number;
  penaltyRecovered: number;
  pendingCases: number;
}

export interface ViolationStats {
  id: string;
  code: string;
  name: string;
  count: number;
  percentage: number;
  severityLevel: number;
}

export interface VesselTypeStats {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface MonthlyData {
  year: number;
  month: number;
  monthName: string;
  observations: number;
  vessels: number;
  penalty: number;
}

export interface TopOffender {
  id: string;
  name: string;
  registrationNumber: string;
  vesselType: string;
  state: string;
  totalViolations: number;
  isFlagged: boolean;
  riskCategory: 'low' | 'medium' | 'high';
  totalPenalty: number;
  lastObservedAt: string;
}

export interface Observation {
  id: string;
  date: string;
  time: string;
  enforcementArea: string;
  flyingLocation: string;
  vesselName: string;
  vesselRegNo: string;
  vesselType: string;
  violationType: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distanceFromCoast: number | null;
  penaltyImposed: number;
  penaltyRecovered: number;
  evidenceUrl?: string;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  enforcementAreaId?: string;
  flyingLocationId?: string;
  violationTypeId?: string;
  status?: string;
  search?: string;
}

export interface DistanceAnalysis {
  distribution: {
    range: string;
    count: number;
    avgDistance: number;
    percentage: number;
  }[];
  summary: {
    totalWithDistance: number;
    totalObservations: number;
    coveragePercent: number;
  };
}

export interface ObservationParams extends FilterParams {
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  enforcementAreas: { id: string; name: string }[];
  flyingLocations: { id: string; name: string; enforcementAreaId: string }[];
  violationTypes: { id: string; code: string; name: string }[];
  vesselTypes: { id: string; name: string }[];
  statuses: { value: string; label: string }[];
}

export interface SyncInfo {
  lastSyncAt?: string;
  lastModifiedTime?: string;
  lastBatch?: {
    id: string;
    completedAt: string;
    newRecords: number;
    duplicates: number;
    errors: number;
  } | null;
}

export interface SyncResult {
  totalRows: number;
  newRecords: number;
  duplicates: number;
  errors: number;
  errorDetails?: { row: number; error: string; field?: string }[];
}

export interface SyncStatus {
  lastSyncAt?: string;
  lastModifiedTime?: string;
  recentBatches: SyncBatch[];
}

export interface SyncBatch {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  durationMs?: number;
  totalRowsScanned: number;
  newRecordsAdded: number;
  duplicateRecords: number;
  errorRecords: number;
  triggeredBy: string;
  triggeredByUser?: string;
  errorMessage?: string;
}

export interface SheetInfo {
  title: string;
  lastModifiedTime: string;
  sheetId: string;
  tabs: string[];
  config?: {
    lastSyncAt: string;
    syncEnabled: boolean;
    syncSchedule: string;
  };
}

export interface SyncConfig {
  sheetId: string;
  syncSchedule: string;
  syncEnabled: boolean;
  timezone: string;
  config?: unknown;
}

export default api;
