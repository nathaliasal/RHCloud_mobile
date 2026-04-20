import http from '@/services/http';
import { ENDPOINTS } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────

export interface PermissionType {
  id: number;
  name: string;
  description: string;
}

export interface PermissionTypesResponse {
  items: PermissionType[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type PermissionStatus = 'rechazado' | 'aprobado' | 'pendiente';

export interface Permission {
  id: number;
  start_date: string;
  end_date: string;
  url: string;
  permission_type: { id: number; name: string };
  is_active: boolean;
  response_status: PermissionStatus;
  justification: string;
}

export interface PermissionsResponse {
  items: Permission[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CreatePermissionPayload {
  start_date: string;
  end_date: string;
  url?: string;
  contract_id: number;
  permission_type_id: number;
}

export interface UpdatePermissionPayload {
  start_date: string;
  end_date: string;
  url?: string;
  permission_type_id: number;
}

// ── API calls ─────────────────────────────────────────────

export async function getContractPermissions(
  contractId: number,
  page = 1,
  pageSize = 20,
): Promise<PermissionsResponse> {
  const response = await http.get<PermissionsResponse>(
    `${ENDPOINTS.permissions.byContract}/${contractId}`,
    { params: { page, page_size: pageSize } },
  );
  return response.data;
}

export async function getPermissionTypes(): Promise<PermissionTypesResponse> {
  const response = await http.get<PermissionTypesResponse>(ENDPOINTS.permissions.types);
  return response.data;
}

export async function createPermission(data: CreatePermissionPayload): Promise<Permission> {
  const response = await http.post<Permission>(ENDPOINTS.permissions.create, data);
  return response.data;
}

export async function updatePermission(
  permissionId: number,
  data: UpdatePermissionPayload,
): Promise<Permission> {
  const response = await http.put<Permission>(
    `${ENDPOINTS.permissions.update}/${permissionId}`,
    data,
  );
  return response.data;
}
