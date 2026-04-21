import { useStockAlert } from '../context/StockAlertContext';
import { StockAlertModal } from './StockAlertModal';

export function GlobalStockAlert() {
  const { showStockAlert, dismissAlert, lowStockItems, outOfStockItems } =
    useStockAlert();

  if (!showStockAlert) return null;

  return (
    <StockAlertModal
      lowStockItems={lowStockItems}
      outOfStockItems={outOfStockItems}
      onClose={dismissAlert}
    />
  );
}