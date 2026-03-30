import axios, { InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import { getTokens, refreshTokens, clearTokens } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';

// ── Axios instance ────────────────────────────────────────

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — adjunta el Bearer token ─────────

http.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh en 401 ───────────

// Cola de requests pendientes mientras se renueva el token
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let isRefreshing = false;
let queue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  queue.forEach((item) => {
    if (error) item.reject(error);
    else item.resolve(token!);
  });
  queue = [];
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: InternalAxiosRequestConfig & { _retry?: boolean } = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Encolar mientras se refresca
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await refreshTokens();
        processQueue(null, tokens.accessToken);
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Sesión expirada: limpiar todo y redirigir al login
        await clearTokens();
        useAuthStore.getState().clearUser();
        router.replace('/(tabs)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
