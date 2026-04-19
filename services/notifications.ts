import { ENDPOINTS } from '@/constants/api';
import http from '@/services/http';

export interface NotificationPayload {
  [key: string]: unknown;
}

export interface NotificationRecord {
  id: number;
  event_type: string;
  title: string;
  message: string;
  payload: NotificationPayload | null;
  status: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  items: NotificationRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface NotificationsQuery {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

interface NotificationUnreadCountResponse {
  unread_count: number;
}

interface CommonMessageResponse {
  message?: string;
  detail?: string;
}

export async function getMyNotifications(
  query: NotificationsQuery = {},
): Promise<NotificationsResponse> {
  const response = await http.get<NotificationsResponse>(ENDPOINTS.notifications.mine, {
    params: {
      page: query.page ?? 1,
      page_size: query.pageSize ?? 25,
      ...(typeof query.isRead === 'boolean' ? { is_read: query.isRead } : {}),
    },
  });

  return response.data;
}

export async function getMyUnreadNotificationsCount(): Promise<number> {
  const response = await http.get<NotificationUnreadCountResponse>(
    ENDPOINTS.notifications.unreadCount,
  );

  return response.data.unread_count;
}

export async function markNotificationAsRead(notificationId: number): Promise<string> {
  const response = await http.patch<CommonMessageResponse>(
    `${ENDPOINTS.notifications.markRead}/${notificationId}/read`,
  );

  return response.data.message ?? response.data.detail ?? 'Notificacion marcada como leida';
}
