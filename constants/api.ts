// ── API Configuration ─────────────────────────────────────
export const API_BASE_URL = 'http://rh-cloud-51.38.33.160.traefik.me';

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
    byEmployee: `${API_BASE_URL}/api/v1/permissions/employee`,
    create: `${API_BASE_URL}/api/v1/permissions/`,
    update: `${API_BASE_URL}/api/v1/permissions`,
    types: `${API_BASE_URL}/api/v1/permission_types/public`,
  },
  vacations: {
    byEmployee: `${API_BASE_URL}/api/v1/vacations/employee`,
    create: `${API_BASE_URL}/api/v1/vacations/`,
    update: `${API_BASE_URL}/api/v1/vacations`,
  },
  contracts: {
    filtered: `${API_BASE_URL}/api/v1/contracts/filtered`,
    schedules: `${API_BASE_URL}/api/v1/schedules/contract`,
  },
} as const;
