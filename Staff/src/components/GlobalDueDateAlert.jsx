import { useDueDateAlert } from '../context/DueDateAlertContext';
import { DueDateAlertModal } from './DueDateAlertModal';

export function GlobalDueDateAlert() {
  const { showDueDateAlert, dueSoonItems, overdueItems, dismissAlert } =
    useDueDateAlert();

  if (!showDueDateAlert) return null;

  return (
    <DueDateAlertModal
      dueSoonItems={dueSoonItems}
      overdueItems={overdueItems}
      onClose={dismissAlert}
    />
  );
}
