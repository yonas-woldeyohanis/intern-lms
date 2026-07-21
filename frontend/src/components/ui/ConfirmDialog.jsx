import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm',
  variant = 'danger', loading = false
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="shrink-0 rounded-full bg-danger-500/10 p-2 h-fit">
          <AlertTriangle className="h-5 w-5 text-danger-500" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
