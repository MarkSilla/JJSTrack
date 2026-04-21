import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { inventoryApi } from '../services/inventoryApi';
import { initAlertSound, playAlertSound } from '../utils/soundAlert';

const StockAlertContext = createContext();

export function StockAlertProvider({ children }) {
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const isCheckingRef = useRef(false);
  const lastAlertedItemsRef = useRef({ low: [], outOfStock: [] });
  const userDismissedRef = useRef(false);

  const checkInventory = async () => {
    if (isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;
      const inventory = await inventoryApi.getAllInventory();
      const activeItems = (Array.isArray(inventory) ? inventory : []).filter(
        (item) => !item.archived
      );

      const detectedLowStock = activeItems.filter((item) => {
        const minStock = Number(item?.minStock) || 5;
        return item.stock > 0 && item.stock < minStock;
      });

      const detectedOutOfStock = activeItems.filter((item) => item.stock === 0);

      const lowStockIds = detectedLowStock.map((item) => item._id).sort();
      const outOfStockIds = detectedOutOfStock.map((item) => item._id).sort();
      const lastLowIds = [...lastAlertedItemsRef.current.low].sort();
      const lastOutIds = [...lastAlertedItemsRef.current.outOfStock].sort();

      const lowStockChanged =
        JSON.stringify(lowStockIds) !== JSON.stringify(lastLowIds);
      const outOfStockChanged =
        JSON.stringify(outOfStockIds) !== JSON.stringify(lastOutIds);

      console.log(
        '[StockAlert] Low Stock - Current:',
        lowStockIds,
        'Last:',
        lastLowIds,
        'Changed:',
        lowStockChanged
      );
      console.log(
        '[StockAlert] Out of Stock - Current:',
        outOfStockIds,
        'Last:',
        lastOutIds,
        'Changed:',
        outOfStockChanged
      );

      setLowStockItems(detectedLowStock);
      setOutOfStockItems(detectedOutOfStock);

      // If items changed, reset dismiss flag so new alerts show again
      if (lowStockChanged || outOfStockChanged) {
        userDismissedRef.current = false;
        lastAlertedItemsRef.current = {
          low: lowStockIds,
          outOfStock: outOfStockIds,
        };

        // Play sound for new alerts
        if (outOfStockChanged && detectedOutOfStock.length > 0) {
          playAlertSound('outOfStock');
        } else if (lowStockChanged && detectedLowStock.length > 0) {
          playAlertSound('lowStock');
        }
      }

      // Only show modal if user has NOT dismissed it and there are problem items
      if (
        !userDismissedRef.current &&
        (detectedLowStock.length > 0 || detectedOutOfStock.length > 0)
      ) {
        setShowStockAlert(true);
      }

      // All items back to normal → clear everything
      if (detectedLowStock.length === 0 && detectedOutOfStock.length === 0) {
        setShowStockAlert(false);
        userDismissedRef.current = false;
        lastAlertedItemsRef.current = { low: [], outOfStock: [] };
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // Initial check on mount
  useEffect(() => {
    initAlertSound();
    checkInventory();
  }, []);

  // Check every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkInventory();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
