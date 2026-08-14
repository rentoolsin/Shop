import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && (
        <p className="mb-4 font-body text-[14px] text-graphite-600 dark:text-graphite-300">
          {description}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" fullWidth onClick={onConfirm} disabled={loading}>
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
