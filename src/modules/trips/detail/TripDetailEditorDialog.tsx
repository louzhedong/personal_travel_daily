import DateField from '../../../components/ui/DateField';
import Dialog from '../../../components/ui/Dialog';
import FancySelect from '../../../components/ui/FancySelect';

interface TripDetailEditorDialogProps {
  open: boolean;
  saving: boolean;
  name: string;
  startsAt: string;
  endsAt: string;
  note: string;
  coverImageUrl: string;
  coverOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSubmit: () => void;
  onNameChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCoverImageUrlChange: (value: string) => void;
}

export default function TripDetailEditorDialog({
  open,
  saving,
  name,
  startsAt,
  endsAt,
  note,
  coverImageUrl,
  coverOptions,
  onClose,
  onSubmit,
  onNameChange,
  onStartsAtChange,
  onEndsAtChange,
  onNoteChange,
  onCoverImageUrlChange,
}: TripDetailEditorDialogProps) {
  const invalid = !name.trim() || !startsAt || !endsAt || endsAt < startsAt;

  return (
    <Dialog open={open} eyebrow="Trip Collection" title="编辑行程" description="调整这次旅行的名称、时间、备注和封面展示。" onClose={onClose}>
      <form
        className="trip-detail-editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="field-control trip-detail-editor-input"
          placeholder="行程名称"
        />
        <div className="trip-detail-editor-date-row">
          <DateField value={startsAt} max={endsAt || undefined} ariaLabel="行程开始日期" onChange={onStartsAtChange} />
          <DateField value={endsAt} min={startsAt || undefined} ariaLabel="行程结束日期" onChange={onEndsAtChange} />
        </div>
        <FancySelect
          value={coverImageUrl}
          onChange={onCoverImageUrlChange}
          placeholder="不设置封面"
          ariaLabel="选择行程封面"
          triggerClassName="trip-detail-editor-select"
          options={[{ value: '', label: '不设置封面' }, ...coverOptions]}
        />
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className="field-control trip-detail-editor-input trip-detail-editor-textarea"
          placeholder="记录这次行程的主题、节奏或最值得记住的一句话"
          rows={4}
        />
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button type="submit" className="primary-button" disabled={invalid || saving}>
            {saving ? '保存中...' : '保存行程'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
