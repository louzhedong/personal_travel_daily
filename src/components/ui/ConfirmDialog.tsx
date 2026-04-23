import type { ReactNode } from 'react';
import Dialog from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  eyebrow,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} eyebrow={eyebrow} description={description} onClose={onCancel}>
      <div className="dialog-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}
