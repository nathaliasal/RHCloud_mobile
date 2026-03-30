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
} as const;
