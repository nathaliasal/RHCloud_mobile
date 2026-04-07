import { ENDPOINTS } from '@/constants/api';
import http from '@/services/http';

// ── Types ─────────────────────────────────────────────────

export type ContractStatus = 'activo' | 'inactivo' | 'suspendido';

export interface Contract {
  id: number;
  contract_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  salary_type: string;
  salary_base: number;
  modificalbe_contract: boolean;
  contract_status: ContractStatus;
  charge_id: number;
  charge_name: string;
}

export interface ContractsResponse {
  items: Contract[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Schedule {
  id: number;
  week_day: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  responsible_user: string | null;
  contract_id: number;
}

export interface ContractFilters {
  employeeId: number;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  page?: number;
  pageSize?: number;
}

// ── API calls ─────────────────────────────────────────────

export async function getContracts(filters: ContractFilters): Promise<ContractsResponse> {
  const response = await http.get<ContractsResponse>(ENDPOINTS.contracts.filtered, {
    params: {
      employee_id: filters.employeeId,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 20,
      ...(filters.startDate ? { start_date: filters.startDate } : {}),
      ...(filters.endDate ? { end_date: filters.endDate } : {}),
      ...(filters.status ? { contract_status: filters.status } : {}),
    },
  });
  return response.data;
}

export async function getContractSchedules(contractId: number): Promise<Schedule[]> {
  const response = await http.get<Schedule[]>(
    `${ENDPOINTS.contracts.schedules}/${contractId}`,
    { params: { is_active: true } },
  );
  return response.data;
}
