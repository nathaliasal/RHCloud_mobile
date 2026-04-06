import http from '@/services/http';
import { ENDPOINTS } from '@/constants/api';

// ── Cambiar contraseña ────────────────────────────────────

export interface ChangePasswordPayload {
  old_password: string;
  password: string;
  password_confirm: string;
}

/**
 * Cambia la contraseña del usuario autenticado.
 * Responde con 204 No Content en caso de éxito.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await http.patch(ENDPOINTS.users.changePassword, payload);
}

// ── Verificar usuario ─────────────────────────────────────

export interface VerifyResponse {
  message: string;
}

/**
 * Marca al usuario autenticado como verificado.
 * Se llama después de que el usuario completa sus datos personales.
 */
export async function verifyUser(isVerified = true): Promise<VerifyResponse> {
  const response = await http.patch<VerifyResponse>(ENDPOINTS.users.verify, null, {
    params: { is_verified: isVerified },
  });
  return response.data;
}
