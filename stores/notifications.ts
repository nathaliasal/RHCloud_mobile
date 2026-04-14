import { create } from 'zustand';
import { NotificationRecord, NotificationsResponse } from '@/services/notifications';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface NotificationsStore {
  items: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  hasNext: boolean;
  currentPage: number;
  realtimeStatus: RealtimeStatus;
  error: string | null;
  replaceFromResponse: (response: NotificationsResponse) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  setRealtimeStatus: (value: RealtimeStatus) => void;
  upsertNotification: (notification: NotificationRecord) => void;
  markAsReadLocal: (notificationId: number, readAt?: string | null) => void;
  reset: () => void;
}

function sortNotifications(items: NotificationRecord[]): NotificationRecord[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.created_at);
    const rightTime = Date.parse(right.created_at);

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return right.id - left.id;
    }

    return rightTime - leftTime;
  });
}

function dedupeNotifications(items: NotificationRecord[]): NotificationRecord[] {
  const map = new Map<number, NotificationRecord>();

  items.forEach((item) => {
    map.set(item.id, item);
  });

  return sortNotifications(Array.from(map.values()));
}

const initialState = {
  items: [] as NotificationRecord[],
  unreadCount: 0,
  loading: false,
  initialized: false,
  hasNext: false,
  currentPage: 1,
  realtimeStatus: 'idle' as RealtimeStatus,
  error: null as string | null,
};

export const useNotificationsStore = create<NotificationsStore>()((set) => ({
  ...initialState,
  replaceFromResponse: (response) =>
    set({
      items: dedupeNotifications(response.items),
      initialized: true,
      loading: false,
      hasNext: response.has_next,
      currentPage: response.page,
      error: null,
    }),
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setLoading: (value) => set({ loading: value }),
  setError: (value) => set({ error: value }),
  setRealtimeStatus: (value) => set({ realtimeStatus: value }),
  upsertNotification: (notification) =>
    set((state) => {
      const previous = state.items.find((item) => item.id === notification.id);

      let nextUnreadCount = state.unreadCount;
      if (!previous && !notification.is_read) {
        nextUnreadCount += 1;
      } else if (previous && previous.is_read !== notification.is_read) {
        nextUnreadCount += notification.is_read ? -1 : 1;
      }

      return {
        items: dedupeNotifications([notification, ...state.items]),
        unreadCount: Math.max(0, nextUnreadCount),
      };
    }),
  markAsReadLocal: (notificationId, readAt = new Date().toISOString()) =>
    set((state) => {
      const target = state.items.find((item) => item.id === notificationId);
      if (!target || target.is_read) return state;

      return {
        items: state.items.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true, read_at: readAt ?? item.read_at }
            : item,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),
  reset: () => set(initialState),
}));
