import { useEffect, useRef } from 'react';
import { WS_BASE_URL } from '@/constants/api';
import { getTokens, refreshTokens } from '@/services/auth';
import {
  getMyNotifications,
  getMyUnreadNotificationsCount,
  NotificationRecord,
} from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

type SocketEnvelope = {
  type?: string;
  data?: unknown;
  notification?: unknown;
  payload?: unknown;
};

function isNotificationRecord(value: unknown): value is NotificationRecord {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.event_type === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.is_read === 'boolean' &&
    typeof candidate.created_at === 'string'
  );
}

function extractNotification(message: SocketEnvelope): NotificationRecord | null {
  const candidates = [message.data, message.notification, message.payload, message];

  for (const candidate of candidates) {
    if (isNotificationRecord(candidate)) {
      return candidate;
    }
  }

  return null;
}

export default function NotificationsBootstrap() {
  const userId = useAuthStore((state) => state.user?.id);
  const replaceFromResponse = useNotificationsStore((state) => state.replaceFromResponse);
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const setLoading = useNotificationsStore((state) => state.setLoading);
  const setError = useNotificationsStore((state) => state.setError);
  const setRealtimeStatus = useNotificationsStore((state) => state.setRealtimeStatus);
  const upsertNotification = useNotificationsStore((state) => state.upsertNotification);
  const reset = useNotificationsStore((state) => state.reset);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      reset();
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getMyNotifications({ page: 1, pageSize: 25 }),
      getMyUnreadNotificationsCount(),
    ])
      .then(([notifications, unreadCount]) => {
        if (cancelled) return;
        replaceFromResponse(notifications);
        setUnreadCount(unreadCount);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones';
        setLoading(false);
        setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [replaceFromResponse, reset, setError, setLoading, setUnreadCount, userId]);

  useEffect(() => {
    isUnmountedRef.current = false;

    if (!userId) {
      setRealtimeStatus('idle');
      return () => {
        isUnmountedRef.current = true;
      };
    }

    const scheduleReconnect = (connect: () => Promise<void>) => {
      reconnectAttemptRef.current += 1;
      const attempt = reconnectAttemptRef.current;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 15000);

      setRealtimeStatus('reconnecting');
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delayMs);
    };

    const connect = async () => {
      setRealtimeStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

      try {
        const tokens = await getTokens();
        const accessToken = tokens?.accessToken;

        if (!accessToken) {
          setRealtimeStatus('idle');
          return;
        }

        const wsUrl = `${WS_BASE_URL}/api/v1/notifications/ws?token=${encodeURIComponent(
          accessToken,
        )}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptRef.current = 0;
          console.log('[Notifications] WebSocket connected', {
            userId,
            url: `${WS_BASE_URL}/api/v1/notifications/ws`,
          });
          setRealtimeStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as SocketEnvelope;

            if (message.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
              return;
            }

            if (
              message.type === 'notification.created' ||
              message.type === 'notification.updated'
            ) {
              const notification = extractNotification(message);
              if (notification) {
                upsertNotification(notification);
              }
            }
          } catch (error) {
            console.warn('[Notifications] Invalid WS message', error);
          }
        };

        ws.onerror = (event) => {
          console.warn('[Notifications] WebSocket error', {
            userId,
            readyState: ws.readyState,
            url: `${WS_BASE_URL}/api/v1/notifications/ws`,
            eventType: event.type,
          });
          setRealtimeStatus('error');
        };

        ws.onclose = async (event) => {
          const closePayload = {
            userId,
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: ws.readyState,
            url: `${WS_BASE_URL}/api/v1/notifications/ws`,
          };

          if (event.code === 1000 && event.reason === 'Notifications bootstrap unmounted') {
            console.log('[Notifications] WebSocket closed', closePayload);
          } else {
            console.warn('[Notifications] WebSocket closed', closePayload);
          }

          if (isUnmountedRef.current) {
            return;
          }

          if (event.code === 1008) {
            try {
              await refreshTokens();
            } catch (error) {
              console.warn('[Notifications] Token refresh failed for WS', error);
              setRealtimeStatus('error');
              return;
            }
          }

          scheduleReconnect(connect);
        };
      } catch (error) {
        console.warn('[Notifications] Unable to connect WS', {
          userId,
          url: `${WS_BASE_URL}/api/v1/notifications/ws`,
          error,
        });
        setRealtimeStatus('error');
        scheduleReconnect(connect);
      }
    };

    void connect();

    return () => {
      isUnmountedRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Notifications bootstrap unmounted');
      }

      wsRef.current = null;
    };
  }, [setRealtimeStatus, upsertNotification, userId]);

  return null;
}
