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

  createUser: (data: CreateUserInput) => {
    // If there's a certificate file or private key file, use FormData
    if (data.certFile || data.privateKeyFile) {
      const formData = new FormData();
      formData.append('userId', data.userId);
      formData.append('fullName', data.fullName);
      formData.append('role', data.role);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.designation) formData.append('designation', data.designation);
      if (data.enforcementAreaId) formData.append('enforcementAreaId', data.enforcementAreaId);
      if (data.canViewAllAreas) formData.append('canViewAllAreas', 'true');
      if (data.password) formData.append('password', data.password);
      if (data.certFile) formData.append('certFile', data.certFile);
      if (data.privateKeyFile) formData.append('privateKeyFile', data.privateKeyFile);
      if (data.privateKeyPassword) formData.append('privateKeyPassword', data.privateKeyPassword);

      return api.post<ApiResponse<{ userId: string; password: string }>>('/auth/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    // Otherwise, use JSON
    return api.post<ApiResponse<{ userId: string; password: string }>>('/auth/users', data);
  },

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

  getDistanceByDistrict: (params?: FilterParams) =>
    api.get<ApiResponse<DistanceByDistrict[]>>('/dashboard/distance/by-district', { params }),

  getSyncInfo: () =>
    api.get<ApiResponse<SyncInfo>>('/dashboard/sync-info'),

  getFilters: () =>
    api.get<ApiResponse<FilterOptions>>('/dashboard/filters'),
};

// Sync APIs
export const syncApi = {
  runSync: () =>
    api.post<ApiResponse<SyncResult>>('/sync/run', {}, { timeout: 120000 }),

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
export type UserRole = 'admin' | 'member' | 'operator' | 'acf' | 'commissioner';

export interface User {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  designation?: string;
  role: UserRole;
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
  role: UserRole;
  email?: string;
  phone?: string;
  designation?: string;
  enforcementAreaId?: string;
  canViewAllAreas?: boolean;
  password?: string;
  certFile?: File;
  privateKeyFile?: File;
  privateKeyPassword?: string;
}

export interface DashboardStats {
  totalObservations: number;
  uniqueVessels: number;
  pendingActions: number;
  detectedPenalty: number;
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

export interface DistanceByDistrict {
  enforcementAreaId: string;
  name: string;
  nearShore: number;
  midZone: number;
  total: number;
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

// Case Management Types
export type CaseStatus = 'reported' | 'under_investigation' | 'hearing_scheduled' | 'disposed' | 'appealed';
export type DataSource = 'sheet' | 'manual';

export interface CaseListItem {
  id: string;
  caseNumber: string | null;
  dataSource: DataSource;
  observationDate: string;
  originalVesselName: string | null;
  originalVesselReg: string | null;
  ownerName: string | null;
  status: CaseStatus;
  penaltyAmount: number | null;
  offenceOccurrence: number;
  enforcementArea: { id: string; name: string };
  flyingLocation: { id: string; name: string };
  vessel: {
    id: string;
    name: string | null;
    registrationNumber: string | null;
    totalViolations: number;
  } | null;
  violationType: { id: string; name: string; code: string } | null;
  evidence: { id: string; evidenceUrl: string; isPrimary: boolean }[];
  createdAt: string;
}

export interface CaseDetail extends CaseListItem {
  latitude: number | null;
  longitude: number | null;
  ownerContact1: string | null;
  ownerContact2: string | null;
  disposalReason: string | null;
  disposedAt: string | null;
  internalNotes: string | null;
  remarksAcf: string | null;
  fishingLicenseType: { id: string; name: string; code: string } | null;
  notices: CaseNotice[];
  penalty: {
    id: string;
    penaltyImposed: number;
    penaltyRecovered: number;
  } | null;
}

export interface CaseNotice {
  id: string;
  noticeNumber: string;
  noticeType: string;
  status: string;
  generatedAt: string;
  sentAt: string | null;
  documentUrl: string | null;
}

export interface CreateCaseInput {
  vesselId?: string | null;
  vesselName: string;
  registrationNumber: string;
  vesselTypeId?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerContact1: string;
  ownerContact2?: string;
  enforcementAreaId: string;
  flyingLocationId: string;
  latitude?: number;
  longitude?: number;
  violationTypeId: string;
  fishingLicenseTypeId?: string;
  observationDate: string;
  observationTime?: string;
  description?: string;
  evidenceUrls?: string[];
  penaltyAmount?: number;
  offenceOccurrence?: number;
}

export interface CaseStats {
  totalCases: number;
  manualCases: number;
  sheetCases: number;
  disposedCases: number;
  pendingCases: number;
  districtStats: {
    districtId: string;
    districtName: string;
    count: number;
  }[];
}

export interface PenaltyCalculation {
  occurrence: number;
  penaltyAmount: number;
  baseAmount: number;
  violationPenalty: number;
}

export interface VesselSuggestion {
  id: string;
  name: string | null;
  registrationNumber: string | null;
  ownerName: string | null;
  ownerContact: string | null;
  totalViolations: number;
  isExisting: boolean;
}

export interface ViolationType {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface FishingLicenseType {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface VesselHistory {
  vessel: {
    id: string;
    name: string | null;
    registrationNumber: string | null;
    ownerName: string | null;
    totalViolations: number;
  };
  totalViolations: number;
  violationsByType: {
    violationType: string;
    count: number;
    disposedCount: number;
    pendingCount: number;
  }[];
  recentViolations: {
    id: string;
    caseNumber: string | null;
    observationDate: string;
    status: string;
    violationType: { name: string } | null;
  }[];
}

export interface NoticePreview {
  caseNumber: string;
  date: string;
  vesselName: string;
  vesselRegistrationNumber: string;
  vesselType: string;
  licenseType: string;
  ownerName: string;
  ownerContact1: string;
  ownerContact2: string;
  violationType: string;
  violationDescription: string;
  observationDate: string;
  latitude: string;
  longitude: string;
  flyingLocation: string;
  enforcementArea: string;
  occurrence: number;
  penaltyAmount: string;
  penaltyAmountWords: string;
  operatorName: string;
  operatorDesignation: string;
}

export interface PenaltyConfig {
  id: string;
  occurrence: number;
  baseAmount: number;
  penaltyAmount: number;
  description: string | null;
  violationType: {
    id: string;
    name: string;
    code: string;
  };
}

// Case APIs
export const caseApi = {
  // Get cases with filters
  getCases: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: CaseStatus;
    dataSource?: DataSource;
    enforcementAreaId?: string;
    violationTypeId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<ApiResponse<{
      cases: CaseListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>('/cases', { params }),

  // Get single case
  getCaseById: (id: string) =>
    api.get<ApiResponse<CaseDetail>>(`/cases/${id}`),

  // Create new case
  createCase: (data: CreateCaseInput) =>
    api.post<ApiResponse<CaseDetail>>('/cases', data),

  // Update case
  updateCase: (id: string, data: Partial<CreateCaseInput>) =>
    api.patch<ApiResponse<CaseDetail>>(`/cases/${id}`, data),

  // Delete case (Admin only)
  deleteCase: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/cases/${id}`),

  // Dispose case
  disposeCase: (id: string, disposalReason: string, paidAmount?: number) =>
    api.post<ApiResponse<void>>(`/cases/${id}/dispose`, { disposalReason, paidAmount }),

  // Get case statistics
  getStats: () =>
    api.get<ApiResponse<CaseStats>>('/cases/stats'),

  // Calculate penalty
  calculatePenalty: (violationTypeId: string, vesselId?: string, occurrence?: number) =>
    api.post<ApiResponse<PenaltyCalculation>>('/cases/calculate-penalty', { violationTypeId, vesselId, occurrence }),

  // Upload evidence
  uploadEvidence: (caseId: string, files: FormData) =>
    api.post<ApiResponse<{ evidenceUrl: string; s3Key: string }[]>>(`/cases/${caseId}/evidence`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get presigned upload URL
  getPresignedUrl: (fileName: string, mimeType: string, caseId?: string) =>
    api.post<ApiResponse<{ uploadUrl: string; key: string }>>('/cases/presigned-url', { fileName, mimeType, caseId }),

  // Generate notice preview
  getNoticePreview: (caseId: string) =>
    api.get<ApiResponse<NoticePreview>>(`/cases/${caseId}/notice-preview`),

  // Generate notice
  generateNotice: (caseId: string, options?: { format?: 'pdf' | 'docx'; includeImages?: boolean; includeSignature?: boolean }) =>
    api.post<ApiResponse<{ previewUrl: string; s3Key: string }>>(`/cases/${caseId}/generate-notice`, options),

  // Send notifications
  sendNotifications: (caseId: string, channels: ('email' | 'sms' | 'whatsapp' | 'call')[]) =>
    api.post<ApiResponse<Record<string, { success: boolean; messageId?: string; error?: string }>>>(`/cases/${caseId}/send-notifications`, { channels }),

  // Lookup APIs
  getViolationTypes: () =>
    api.get<ApiResponse<ViolationType[]>>('/cases/violation-types'),

  getLicenseTypes: () =>
    api.get<ApiResponse<FishingLicenseType[]>>('/cases/license-types'),

  getEnforcementAreas: () =>
    api.get<ApiResponse<{ id: string; name: string }[]>>('/cases/enforcement-areas'),

  // Alias for enforcement areas (used as districts)
  getDistricts: () =>
    api.get<ApiResponse<{ id: string; name: string; code: string }[]>>('/cases/enforcement-areas'),

  getFlyingLocations: (enforcementAreaId?: string) =>
    api.get<ApiResponse<{ id: string; name: string; enforcementAreaId: string }[]>>('/cases/flying-locations', {
      params: enforcementAreaId ? { enforcementAreaId } : {},
    }),

  // Get presigned S3 upload URL
  getUploadUrl: (mimeType: string, fileName?: string) =>
    api.post<ApiResponse<{ uploadUrl: string; key: string }>>('/cases/presigned-url', { mimeType, fileName: fileName || `image-${Date.now()}` }),

  // Vessel APIs
  searchVessels: (query: string, limit?: number) =>
    api.get<ApiResponse<VesselSuggestion[]>>('/cases/vessels/search', { params: { q: query, limit } }),

  getVesselByRegNumber: (regNumber: string) =>
    api.get<ApiResponse<VesselHistory['vessel']>>(`/cases/vessels/by-reg/${regNumber}`),

  getVesselHistory: (vesselId: string) =>
    api.get<ApiResponse<VesselHistory>>(`/cases/vessels/${vesselId}/history`),

  // Penalty Config APIs (Admin)
  getPenaltyConfigs: () =>
    api.get<ApiResponse<PenaltyConfig[]>>('/cases/penalty-config'),

  updatePenaltyConfig: (id: string, data: { baseAmount?: number; penaltyAmount?: number }) =>
    api.patch<ApiResponse<PenaltyConfig>>(`/cases/penalty-config/${id}`, data),

  createPenaltyConfig: (data: { violationTypeId: string; occurrence: number; baseAmount: number; penaltyAmount: number }) =>
    api.post<ApiResponse<PenaltyConfig>>('/cases/penalty-config', data),

  // PDF Generation
  generateCasePdf: (caseId: string, sendEmails: boolean = false) =>
    api.post<ApiResponse<{
      s3Key: string;
      pdfUrl: string | null;
      emailsSent?: number;
      emailsFailed?: number;
      emailResults?: Array<{ success: boolean; recipient: string; role: string; error?: string }>;
    }>>(`/cases/${caseId}/generate-pdf`, { sendEmails }),

  generatePdfPreview: (data: {
    vesselName: string;
    registrationNumber: string;
    ownerName: string;
    districtName: string;
    flyingLocationName: string;
    latitude?: string;
    longitude?: string;
    violationTypeName: string;
    fishingLicenseTypeName?: string;
    observationDate: string;
    processingFee: number;
    violationPenalty: number;
    totalPenalty: number;
    occurrence: number;
    images?: string[];
  }) =>
    api.post<ApiResponse<{ pdfBase64: string; mimeType: string }>>('/cases/generate-pdf-preview', data),

  // Check ACF certificate status for a district
  checkCertificateStatus: (enforcementAreaId: string) =>
    api.get<ApiResponse<{
      hasCertificate: boolean;
      acfName?: string;
      certificateSubject?: string;
      certificateExpiry?: string;
      error?: string;
    }>>(`/cases/check-certificate/${enforcementAreaId}`),
};

export default api;
