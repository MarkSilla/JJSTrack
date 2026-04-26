import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useOrderFeedSocket from '../hooks/useOrderFeedSocket';
import { bookingApi } from '../services/bookingApi';
import { orderApi } from '../services/orderApi';
import { buildDueDateAlerts } from '../utils/alertMonitor';
import { initAlertSound, playAlertSound } from '../utils/soundAlert';

const DueDateAlertContext = createContext();
const DUE_DATE_ALERT_POLL_INTERVAL_MS = 60000;

const createEmptyAlertSnapshots = () => ({
  dueSoon: [],
  overdue: [],
});

const normalizeCollection = (payload, key) => {
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getSortedAlertKeys = (items = []) =>
  items
    .map((item) => item?.alertKey || item?._id || item?.id || '')
    .filter(Boolean)
    .sort();

export function DueDateAlertProvider({ children }) {
  const [showDueDateAlert, setShowDueDateAlert] = useState(false);
  const [dueSoonItems, setDueSoonItems] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const isCheckingRef = useRef(false);
  const userDismissedRef = useRef(false);
  const lastAlertedItemsRef = useRef(createEmptyAlertSnapshots());

  const syncAlertState = useCallback(({ dueSoonItems: nextDueSoonItems = [], overdueItems: nextOverdueItems = [] }) => {
    const nextSnapshots = {
      dueSoon: getSortedAlertKeys(nextDueSoonItems),
      overdue: getSortedAlertKeys(nextOverdueItems),
    };

    const changedFlags = {
      dueSoon:
        JSON.stringify(nextSnapshots.dueSoon) !==
        JSON.stringify(lastAlertedItemsRef.current.dueSoon),
      overdue:
        JSON.stringify(nextSnapshots.overdue) !==
        JSON.stringify(lastAlertedItemsRef.current.overdue),
    };

    setDueSoonItems(nextDueSoonItems);
    setOverdueItems(nextOverdueItems);

    if (changedFlags.dueSoon || changedFlags.overdue) {
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = nextSnapshots;

      if (changedFlags.overdue && nextOverdueItems.length > 0) {
        playAlertSound('overdue');
      } else if (changedFlags.dueSoon && nextDueSoonItems.length > 0) {
        playAlertSound('dueSoon');
      }
    }

    if (!userDismissedRef.current && (nextDueSoonItems.length > 0 || nextOverdueItems.length > 0)) {
      setShowDueDateAlert(true);
      return;
    }

    if (nextDueSoonItems.length === 0 && nextOverdueItems.length === 0) {
      setShowDueDateAlert(false);
      userDismissedRef.current = false;
      lastAlertedItemsRef.current = createEmptyAlertSnapshots();
    }
  }, []);

  const checkDueDateAlerts = useCallback(async () => {
    if (isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;

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

      syncAlertState(
        buildDueDateAlerts({
          orders,
          bookings,
          routeBuilder: ({ id }) => (id ? `/staff/orders/${id}` : '/staff/orders'),
        })
      );
    } catch (error) {
      console.error('Error checking staff due date alerts:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [syncAlertState]);

  useEffect(() => {
    initAlertSound();
    void checkDueDateAlerts();
  }, [checkDueDateAlerts]);

  useOrderFeedSocket(() => {
    void checkDueDateAlerts();
  });

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
    setShowDueDateAlert(false);
  };

  return (
    <DueDateAlertContext.Provider
      value={{
        showDueDateAlert,
        dueSoonItems,
        overdueItems,
        checkDueDateAlerts,
        dismissAlert,
      }}
    >
      {children}
    </DueDateAlertContext.Provider>
  );
}

export function useDueDateAlert() {
  const context = useContext(DueDateAlertContext);
  if (!context) {
    throw new Error('useDueDateAlert must be used within DueDateAlertProvider');
  }
  return context;
}
