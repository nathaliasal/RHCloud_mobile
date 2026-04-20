import http from '@/services/http';
import { ENDPOINTS } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────

export type VacationStatus = 'rechazado' | 'aprobado' | 'pendiente';

export interface Vacation {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
  response_status: VacationStatus;
  justification: string;
}

export interface VacationsResponse {
  items: Vacation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CreateVacationPayload {
  start_date: string;
  end_date: string;
  reason: string;
  contract_id: number;
}

export interface UpdateVacationPayload {
  start_date: string;
  end_date: string;
  reason: string;
}

// ── API calls ─────────────────────────────────────────────

export async function getContractVacations(
  contractId: number,
  page = 1,
  pageSize = 20,
): Promise<VacationsResponse> {
  const response = await http.get<VacationsResponse>(
    `${ENDPOINTS.vacations.byContract}/${contractId}`,
    { params: { page, page_size: pageSize } },
  );
  return response.data;
}

export async function createVacation(data: CreateVacationPayload): Promise<Vacation> {
  const response = await http.post<Vacation>(ENDPOINTS.vacations.create, data);
  return response.data;
}

export async function updateVacation(
  vacationId: number,
  data: UpdateVacationPayload,
): Promise<Vacation> {
  const response = await http.put<Vacation>(
    `${ENDPOINTS.vacations.update}/${vacationId}`,
    data,
  );
  return response.data;
}
