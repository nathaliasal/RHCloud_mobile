const DEFAULT_API_BASE_URL = 'https://dev.stalch.com';

function normalizeBaseUrl(value?: string): string {
  return (value?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const WS_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_WS_BASE_URL)
  .replace(/^http:\/\//i, 'ws://')
  .replace(/^https:\/\//i, 'wss://');

export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/v1/auth/login`,
    refresh: `${API_BASE_URL}/api/v1/auth/refresh`,
    recoverPassword: `${API_BASE_URL}/api/v1/auth/recover-password`,
    resetPassword: `${API_BASE_URL}/api/v1/auth/reset-password`,
    me: `${API_BASE_URL}/api/v1/auth/me`,
  },
  users: {
    verify: `${API_BASE_URL}/api/v1/users/verify`,
    changePassword: `${API_BASE_URL}/api/v1/users/password`,
  },
  persons: {
    create: `${API_BASE_URL}/api/v1/persons/`,
    documentTypes: `${API_BASE_URL}/api/v1/persons/document/available`,
    genders: `${API_BASE_URL}/api/v1/persons/genders/available`,
    myProfile: `${API_BASE_URL}/api/v1/persons/me/profile`,
    updateProfile: `${API_BASE_URL}/api/v1/persons/me/profile`,
  },
  permissions: {
    byContract: `${API_BASE_URL}/api/v1/permissions/contract`,
    create: `${API_BASE_URL}/api/v1/permissions/`,
    update: `${API_BASE_URL}/api/v1/permissions`,
    types: `${API_BASE_URL}/api/v1/permission_types/public`,
  },
  vacations: {
    byContract: `${API_BASE_URL}/api/v1/vacations/contract`,
    create: `${API_BASE_URL}/api/v1/vacations/`,
    update: `${API_BASE_URL}/api/v1/vacations`,
  },
  contracts: {
    filtered: `${API_BASE_URL}/api/v1/contracts/filtered`,
    schedules: `${API_BASE_URL}/api/v1/schedules/contract`,
    base:      `${API_BASE_URL}/api/v1/contracts`,
  },
  notifications: {
    mine: `${API_BASE_URL}/api/v1/notifications/me`,
    unreadCount: `${API_BASE_URL}/api/v1/notifications/me/unread-count`,
    markRead: `${API_BASE_URL}/api/v1/notifications`,
    realtimeHealth: `${API_BASE_URL}/api/v1/notifications/health/realtime`,
  },
} as const;
