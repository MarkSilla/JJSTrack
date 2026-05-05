import { useEffect, useRef } from 'react';
import { getOrderFeedUpdatesWebSocketUrl } from '../services/realtimeApi.js';
import { handleAdminUnauthorized } from '../utils/adminApiAuth.js';

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

      socket.onclose = (event) => {
        if (isDisposed) {
          return;
        }

        if (event?.code === 4401) {
          handleAdminUnauthorized();
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
        const socket = socketRef.current;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => socket.close();
        }
      }
    };
  }, [enabled]);
};

export default useOrderFeedSocket;
