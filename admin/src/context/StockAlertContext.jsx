import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getInventoryUpdatesWebSocketUrl, inventoryApi } from '../services/inventoryApi';
import { initAlertSound, playAlertSound } from '../utils/soundAlert';

const StockAlertContext = createContext();
const SOCKET_RECONNECT_MS = 1000;
const SOCKET_REFRESH_DEBOUNCE_MS = 75;
const ALERT_POLL_INTERVAL_MS = 1000;

const getAlertLevel = (item = {}) => {
  if (item?.archived) return 'normal';

  const stock = Math.max(0, Number(item?.stock) || 0);
  const minStock = Math.max(0, Number(item?.minStock) || 5);

  if (stock === 0) return 'outOfStock';
  if (stock <= minStock) return 'lowStock';
  return 'normal';
};

const sortAlertItems = (items = []) =>
  [...items].sort((left, right) =>
    String(left?.name || '').localeCompare(String(right?.name || ''))
  );

const getSortedIds = (items = []) =>
  items.map((item) => item?._id).filter(Boolean).sort();

export function StockAlertProvider({ children }) {
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const isCheckingRef = useRef(false);
  const lastAlertedItemsRef = useRef({ low: [], outOfStock: [] });
  const userDismissedRef = useRef(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const alertItemsRef = useRef({ lowStock: [], outOfStock: [] });

  const syncAlertState = useCallback(({ nextLowStockItems = [], nextOutOfStockItems = [] }) => {
    const normalizedLowStockItems = sortAlertItems(nextLowStockItems);
    const normalizedOutOfStockItems = sortAlertItems(nextOutOfStockItems);

    const lowStockIds = getSortedIds(normalizedLowStockItems);
    const outOfStockIds = getSortedIds(normalizedOutOfStockItems);
    const lastLowIds = [...lastAlertedItemsRef.current.low].sort();
    const lastOutIds = [...lastAlertedItemsRef.current.outOfStock].sort();

    const lowStockChanged =
      JSON.stringify(lowStockIds) !== JSON.stringify(lastLowIds);
    const outOfStockChanged =
      JSON.stringify(outOfStockIds) !== JSON.stringify(lastOutIds);

    alertItemsRef.current = {
      lowStock: normalizedLowStockItems,
      outOfStock: normalizedOutOfStockItems,
    };

    setLowStockItems(normalizedLowStockItems);
    setOutOfStockItems(normalizedOutOfStockItems);

    if (lowStockChanged || outOfStockChanged) {
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = {
        low: lowStockIds,
        outOfStock: outOfStockIds,
      };

      if (outOfStockChanged && normalizedOutOfStockItems.length > 0) {
        playAlertSound('outOfStock');
      } else if (lowStockChanged && normalizedLowStockItems.length > 0) {
        playAlertSound('lowStock');
      }
    }

    if (
      !userDismissedRef.current &&
      (normalizedLowStockItems.length > 0 || normalizedOutOfStockItems.length > 0)
    ) {
      setShowStockAlert(true);
      return;
    }

    if (normalizedLowStockItems.length === 0 && normalizedOutOfStockItems.length === 0) {
      setShowStockAlert(false);
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = { low: [], outOfStock: [] };
    }
  }, []);

  const checkInventory = useCallback(async () => {
    if (isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;
      const inventory = await inventoryApi.getAllInventory();
      const activeItems = (Array.isArray(inventory) ? inventory : []).filter(
        (item) => !item.archived
      );

      syncAlertState({
        nextLowStockItems: activeItems.filter((item) => getAlertLevel(item) === 'lowStock'),
        nextOutOfStockItems: activeItems.filter((item) => getAlertLevel(item) === 'outOfStock'),
      });
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [syncAlertState]);

  useEffect(() => {
    initAlertSound();
    void checkInventory();
  }, [checkInventory]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let isDisposed = false;

    const scheduleInventoryCheck = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        if (!isDisposed) {
          void checkInventory();
        }
      }, SOCKET_REFRESH_DEBOUNCE_MS);
    };

    const connectInventorySocket = () => {
      if (isDisposed) return;

      const socket = new WebSocket(getInventoryUpdatesWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isDisposed) {
          scheduleInventoryCheck();
        }
      };

      socket.onmessage = (event) => {
        if (isDisposed) return;

        try {
          const message = JSON.parse(event.data);

          if (message?.type === 'inventory:changed' && message?.inventoryId) {
            const liveItem = {
              _id: message.inventoryId,
              name: message.name || 'Inventory item',
              sku: message.sku || '',
              category: message.category || '',
              stock: Math.max(0, Number(message.stock) || 0),
              minStock: Math.max(0, Number(message.minStock) || 5),
              unit: message.unit || '',
              archived: Boolean(message.archived),
            };
            const nextAlertLevel =
              typeof message.alertLevel === 'string'
                ? message.alertLevel
                : getAlertLevel(liveItem);
            const currentLowStockItems = alertItemsRef.current.lowStock.filter(
              (item) => item?._id !== liveItem._id
            );
            const currentOutOfStockItems = alertItemsRef.current.outOfStock.filter(
              (item) => item?._id !== liveItem._id
            );

            syncAlertState({
              nextLowStockItems:
                nextAlertLevel === 'lowStock'
                  ? [...currentLowStockItems, liveItem]
                  : currentLowStockItems,
              nextOutOfStockItems:
                nextAlertLevel === 'outOfStock'
                  ? [...currentOutOfStockItems, liveItem]
                  : currentOutOfStockItems,
            });
          }

          if (
            message?.type === 'inventory:changed' ||
            message?.type === 'inventory:connected'
          ) {
            scheduleInventoryCheck();
          }
        } catch (socketError) {
          console.error('Failed to parse stock alert socket message:', socketError);
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
        if (isDisposed) return;

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectInventorySocket();
        }, SOCKET_RECONNECT_MS);
      };
    };

    connectInventorySocket();

    return () => {
      isDisposed = true;

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        socketRef.current.close();
      }
    };
  }, [checkInventory, syncAlertState]);

  useEffect(() => {
    const interval = setInterval(() => {
      void checkInventory();
    }, ALERT_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkInventory]);

  const dismissAlert = () => {
    userDismissedRef.current = true;
    setShowStockAlert(false);
  };

  return (
    <StockAlertContext.Provider
      value={{
        showStockAlert,
        setShowStockAlert,
        lowStockItems,
        outOfStockItems,
        checkInventory,
        dismissAlert,
      }}
    >
      {children}
    </StockAlertContext.Provider>
  );
}

export function useStockAlert() {
  const context = useContext(StockAlertContext);
  if (!context) {
    throw new Error('useStockAlert must be used within StockAlertProvider');
  }
  return context;
}
