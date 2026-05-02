import { useEffect, useRef } from 'react';
import { getOrderFeedUpdatesWebSocketUrl } from '../services/realtimeApi.js';

const SOCKET_RECONNECT_MS = 2500;
const REFRESH_DEBOUNCE_MS = 250;

const useOrderFeedSocket = (onRefresh, { enabled = true } = {}) => {
  const callbackRef = useRef(onRefresh);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    let isDisposed = false;

    const queueRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        callbackRef.current?.();
      }, REFRESH_DEBOUNCE_MS);
    };

    const connect = () => {
      const socketUrl = getOrderFeedUpdatesWebSocketUrl();
      if (!socketUrl || isDisposed) {
        return;
      }

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        if (isDisposed) {
          return;
        }

        try {
          const message = JSON.parse(event.data);
          if (message?.type !== 'feed:refresh' || message?.channel !== 'orders') {
            return;
          }

          queueRefresh();
        } catch (error) {
          console.error('Failed to parse order feed websocket message:', error);
        }
      };

      socket.onerror = () => {
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      };

      socket.onclose = () => {
        if (isDisposed) {
          return;
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, SOCKET_RECONNECT_MS);
      };
    };

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      if (socketRef.current) {
        const ws = socketRef.current;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        }
      }
    };
  }, [enabled]);
};

export default useOrderFeedSocket;
