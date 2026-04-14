import { useEffect, useRef } from "react";

/**
 * Hook de WebSocket para React Web.
 *
 * Caracteristicas:
 * - Conexion a /api/v1/notifications/ws?token=...
 * - Respuesta automatica a ping -> pong
 * - Reconexion con backoff
 * - Refresh token cuando el servidor cierra con codigo 1008
 */
export function useNotificationsSocketWeb({
  wsBaseUrl,
  getAccessToken,
  refreshAccessToken,
  onNotification,
  onOpen,
  onClose,
  onError,
}) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;

    const connect = async () => {
      const token = await getAccessToken?.();
      if (!token) {
        onError?.(new Error("No access token disponible para abrir WebSocket"));
        return;
      }

      const wsUrl = `${wsBaseUrl.replace(/\/$/, "")}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
            return;
          }

          if (msg.type === "notification.created" || msg.type === "notification.updated") {
            onNotification?.(msg);
          }
        } catch (err) {
          onError?.(err);
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onclose = async (event) => {
        onClose?.(event);

        if (isUnmountedRef.current) {
          return;
        }

        // 1008: token invalido/expirado (policy violation)
        if (event.code === 1008 && refreshAccessToken) {
          try {
            await refreshAccessToken();
          } catch (err) {
            onError?.(err);
            return;
          }
        }

        scheduleReconnect(connect);
      };
    };

    const scheduleReconnect = (connectFn) => {
      reconnectAttemptRef.current += 1;
      const attempt = reconnectAttemptRef.current;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 15000);

      reconnectTimerRef.current = setTimeout(() => {
        connectFn();
      }, delayMs);
    };

    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [wsBaseUrl, getAccessToken, refreshAccessToken, onNotification, onOpen, onClose, onError]);
}
