import http from '@/services/http';
import { ENDPOINTS } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────

export interface BotTerm {
  id: number;
  title: string;
  description: string;
  company_id: number;
}

export interface BotResponse {
  items: BotTerm[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ── API call ──────────────────────────────────────────────

export async function queryBot(message: string, page = 1, pageSize = 10): Promise<BotResponse> {
  const response = await http.post<BotResponse>(
    ENDPOINTS.bot.query,
    { message },
    { params: { page, page_size: pageSize } },
  );
  return response.data;
}
