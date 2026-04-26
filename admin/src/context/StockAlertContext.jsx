import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { bookingApi } from '../services/bookingApi';
import useOrderFeedSocket from '../hooks/useOrderFeedSocket';
import { orderApi } from '../services/orderApi';
import { getInventoryUpdatesWebSocketUrl, inventoryApi } from '../services/inventoryApi';
import { buildDueDateAlerts } from '../utils/alertMonitor';
import { initAlertSound, playAlertSound } from '../utils/soundAlert';

const StockAlertContext = createContext();
const SOCKET_RECONNECT_MS = 1000;
const SOCKET_REFRESH_DEBOUNCE_MS = 75;
const INVENTORY_ALERT_POLL_INTERVAL_MS = 1000;
const DUE_DATE_ALERT_POLL_INTERVAL_MS = 60000;

const createEmptyAlertCollections = () => ({
  lowStockItems: [],
  outOfStockItems: [],
  dueSoonItems: [],
  overdueItems: [],
});

const createEmptyAlertSnapshots = () => ({
  lowStock: [],
  outOfStock: [],
  dueSoon: [],
  overdue: [],
});

const normalizeCollection = (payload, key) => {
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getAlertLevel = (item = {}) => {
  if (item?.archived) return 'normal';

  const stock = Math.max(0, Number(item?.stock) || 0);
  const minStock = Math.max(0, Number(item?.minStock) || 5);

  if (stock === 0) return 'outOfStock';
  if (stock <= minStock) return 'lowStock';
  return 'normal';
};

const sortInventoryAlertItems = (items = []) =>
  [...items].sort((left, right) =>
    String(left?.name || '').localeCompare(String(right?.name || ''))
  );

const getSortedAlertKeys = (items = []) =>
  items
    .map((item) => item?.alertKey || item?._id || item?.id || '')
    .filter(Boolean)
    .sort();

const hasActiveAlerts = (collections = createEmptyAlertCollections()) =>
  Object.values(collections).some((items) => Array.isArray(items) && items.length > 0);

const getPrioritySoundType = (changedFlags, nextCollections) => {
  if (changedFlags.overdue && nextCollections.overdueItems.length > 0) {
    return 'overdue';
  }

  if (changedFlags.outOfStock && nextCollections.outOfStockItems.length > 0) {
    return 'outOfStock';
  }

  if (changedFlags.dueSoon && nextCollections.dueSoonItems.length > 0) {
    return 'dueSoon';
  }

  if (changedFlags.lowStock && nextCollections.lowStockItems.length > 0) {
    return 'lowStock';
  }

  return '';
};

export function StockAlertProvider({ children }) {
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [dueSoonItems, setDueSoonItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const isCheckingInventoryRef = useRef(false);
  const isCheckingDueDatesRef = useRef(false);
  const lastAlertedItemsRef = useRef(createEmptyAlertSnapshots());
  const userDismissedRef = useRef(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const alertItemsRef = useRef(createEmptyAlertCollections());

  const syncAlertState = useCallback((partialCollections = {}) => {
    const nextCollections = {
      lowStockItems: sortInventoryAlertItems(
        partialCollections.lowStockItems ?? alertItemsRef.current.lowStockItems
      ),
      outOfStockItems: sortInventoryAlertItems(
        partialCollections.outOfStockItems ?? alertItemsRef.current.outOfStockItems
      ),
      dueSoonItems: [...(partialCollections.dueSoonItems ?? alertItemsRef.current.dueSoonItems)],
      overdueItems: [...(partialCollections.overdueItems ?? alertItemsRef.current.overdueItems)],
    };

    const nextSnapshots = {
      lowStock: getSortedAlertKeys(nextCollections.lowStockItems),
      outOfStock: getSortedAlertKeys(nextCollections.outOfStockItems),
      dueSoon: getSortedAlertKeys(nextCollections.dueSoonItems),
      overdue: getSortedAlertKeys(nextCollections.overdueItems),
    };

    const changedFlags = {
      lowStock:
        JSON.stringify(nextSnapshots.lowStock) !==
        JSON.stringify(lastAlertedItemsRef.current.lowStock),
      outOfStock:
        JSON.stringify(nextSnapshots.outOfStock) !==
        JSON.stringify(lastAlertedItemsRef.current.outOfStock),
      dueSoon:
        JSON.stringify(nextSnapshots.dueSoon) !==
        JSON.stringify(lastAlertedItemsRef.current.dueSoon),
      overdue:
        JSON.stringify(nextSnapshots.overdue) !==
        JSON.stringify(lastAlertedItemsRef.current.overdue),
    };

    alertItemsRef.current = nextCollections;

    setLowStockItems(nextCollections.lowStockItems);
    setOutOfStockItems(nextCollections.outOfStockItems);
    setDueSoonItems(nextCollections.dueSoonItems);
    setOverdueItems(nextCollections.overdueItems);

    if (Object.values(changedFlags).some(Boolean)) {
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = nextSnapshots;

      const nextSoundType = getPrioritySoundType(changedFlags, nextCollections);
      if (nextSoundType) {
        playAlertSound(nextSoundType);
      }
    }

    if (!userDismissedRef.current && hasActiveAlerts(nextCollections)) {
      setShowStockAlert(true);
      return;
    }

    if (!hasActiveAlerts(nextCollections)) {
      setShowStockAlert(false);
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = createEmptyAlertSnapshots();
    }
  }, []);

  const checkInventory = useCallback(async () => {
    if (isCheckingInventoryRef.current) return;

    try {
      isCheckingInventoryRef.current = true;
      const inventory = await inventoryApi.getAllInventory();
      const activeItems = normalizeCollection(inventory).filter((item) => !item.archived);

      syncAlertState({
        lowStockItems: activeItems.filter((item) => getAlertLevel(item) === 'lowStock'),
        outOfStockItems: activeItems.filter((item) => getAlertLevel(item) === 'outOfStock'),
      });
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      isCheckingInventoryRef.current = false;
    }
  }, [syncAlertState]);

  const checkDueDateAlerts = useCallback(async () => {
    if (isCheckingDueDatesRef.current) return;

    try {
      isCheckingDueDatesRef.current = true;

      const [ordersResponse, bookingsResponse] = await Promise.allSettled([
        orderApi.getAllOrders(),
        bookingApi.getAllBookings(),
      ]);

      const orders =
        ordersResponse.status === 'fulfilled'
          ? normalizeCollection(ordersResponse.value, 'orders')
          : [];
      const bookings =
        bookingsResponse.status === 'fulfilled'
          ? normalizeCollection(bookingsResponse.value, 'bookings')
          : [];

      const nextDueAlerts = buildDueDateAlerts({
        orders,
        bookings,
        routeBuilder: ({ id }) => (id ? `/admin/orders/${id}` : '/admin/orders'),
      });

      syncAlertState(nextDueAlerts);
    } catch (error) {
      console.error('Error checking due date alerts:', error);
    } finally {
      isCheckingDueDatesRef.current = false;
    }
  }, [syncAlertState]);

  useEffect(() => {
    initAlertSound();
    void checkInventory();
    void checkDueDateAlerts();
  }, [checkDueDateAlerts, checkInventory]);

  useOrderFeedSocket(() => {
    void checkDueDateAlerts();
  });

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
            const currentLowStockItems = alertItemsRef.current.lowStockItems.filter(
              (item) => item?._id !== liveItem._id
            );
            const currentOutOfStockItems = alertItemsRef.current.outOfStockItems.filter(
              (item) => item?._id !== liveItem._id
            );

            syncAlertState({
              lowStockItems:
                nextAlertLevel === 'lowStock'
                  ? [...currentLowStockItems, liveItem]
                  : currentLowStockItems,
              outOfStockItems:
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
    }, INVENTORY_ALERT_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkInventory]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      void checkDueDateAlerts();
    }, DUE_DATE_ALERT_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkDueDateAlerts]);

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
        dueSoonItems,
        overdueItems,
        checkInventory,
        checkDueDateAlerts,
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
