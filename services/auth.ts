import * as SecureStore from 'expo-secure-store';
import { ENDPOINTS } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ValidationError {
  detail: {
    loc: (string | number)[];
    msg: string;
    type: string;
  }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  role: string;
}

// ── Secure Storage keys ───────────────────────────────────
// SecureStore solo acepta: letras, números, puntos, guiones y guiones bajos

const KEYS = {
  ACCESS_TOKEN: 'rhcloud.access_token',
  REFRESH_TOKEN: 'rhcloud.refresh_token',
} as const;

// ── Token helpers ─────────────────────────────────────────

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

export async function getTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
  ]);
}

// ── Refresh Token ─────────────────────────────────────────

export async function refreshTokens(): Promise<AuthTokens> {
  const stored = await getTokens();
  if (!stored) throw new Error('No hay sesión activa');

  const response = await fetch(ENDPOINTS.auth.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: stored.refreshToken }),
  });

  if (response.status === 422) {
    const error: ValidationError = await response.json();
    const msg = error.detail?.[0]?.msg ?? 'Error de validación';
    throw new Error(msg);
  }

  if (!response.ok) {
    await clearTokens();
    throw new Error('La sesión ha expirado, inicia sesión de nuevo');
  }

  const data: LoginResponse = await response.json();
  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  await saveTokens(tokens);
  return tokens;
}

// ── Recover Password ──────────────────────────────────────

export async function recoverPassword(email: string): Promise<string> {
  const response = await fetch(ENDPOINTS.auth.recoverPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.status === 422) {
    const error: ValidationError = await response.json();
    const msg = error.detail?.[0]?.msg ?? 'Error de validación';
    throw new Error(msg);
  }

  if (!response.ok) throw new Error('No se pudo enviar el correo de recuperación');

  return await response.json();
}

// ── Reset Password ────────────────────────────────────────

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<string> {
  const response = await fetch(ENDPOINTS.auth.resetPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (response.status === 422) {
    const error: ValidationError = await response.json();
    const msg = error.detail?.[0]?.msg ?? 'Error de validación';
    throw new Error(msg);
  }

  if (!response.ok) throw new Error('El enlace es inválido o ha expirado');

  return await response.json();
}

// ── Get Me ────────────────────────────────────────────────

export async function getMe(): Promise<UserProfile> {
  const tokens = await getTokens();
  if (!tokens) throw new Error('No hay sesión activa');

  const response = await fetch(ENDPOINTS.auth.me, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  if (response.status === 401) throw new Error('Sesión expirada');
  if (!response.ok) throw new Error('No se pudo obtener la información del usuario');

  return await response.json();
}

// ── Login ─────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<AuthTokens> {
  const body = new URLSearchParams({ grant_type: 'password', username, password });

  const response = await fetch(ENDPOINTS.auth.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (response.status === 422) {
    const error: ValidationError = await response.json();
    const msg = error.detail?.[0]?.msg ?? 'Error de validación';
    throw new Error(msg);
  }

  if (!response.ok) throw new Error('Usuario o contraseña incorrectos');

  const data: LoginResponse = await response.json();
  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  await saveTokens(tokens);
  return tokens;
}
