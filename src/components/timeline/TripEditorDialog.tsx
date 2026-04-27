import Dialog from '../ui/Dialog';
import DateField from '../ui/DateField';
import type { TripDialogMode } from '../../modules/app/useTripTimelineActions';

/**
 * Dialog for creating/editing a trip collection.
 * 创建/编辑行程对话框：在容器之外独立渲染，保持容器编排专注。
 */

export interface TripEditorDialogProps {
  mode: TripDialogMode;
  name: string;
  startsAt: string;
  endsAt: string;
  note: string;
  canSubmit: boolean;
  onNameChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function TripEditorDialog({
  mode,
  name,
  startsAt,
  endsAt,
  note,
  canSubmit,
  onNameChange,
  onStartsAtChange,
  onEndsAtChange,
  onNoteChange,
  onSubmit,
  onClose,
}: TripEditorDialogProps) {
  return (
    <Dialog
      open={mode !== null}
      eyebrow="Trip Collection"
      title={mode === 'edit' ? '编辑行程' : '创建行程'}
      onClose={onClose}
    >
      <form
        className="trip-collection-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="field-control trip-collection-input"
          placeholder="新建行程，例如 2025 日本春游"
        />
        <div className="trip-collection-date-row">
          <DateField
            value={startsAt}
            max={endsAt || undefined}
            onChange={onStartsAtChange}
            ariaLabel="行程开始日期"
          />
          <DateField
            value={endsAt}
            min={startsAt || undefined}
            onChange={onEndsAtChange}
            ariaLabel="行程结束日期"
          />
        </div>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className="field-control trip-collection-input trip-collection-textarea"
          placeholder="备注，可选"
          rows={4}
        />
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary-button trip-collection-submit" disabled={!canSubmit}>
            {mode === 'edit' ? '保存行程' : '创建行程'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
