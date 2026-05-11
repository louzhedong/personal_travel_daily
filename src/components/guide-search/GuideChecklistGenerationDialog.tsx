import Dialog from '../ui/Dialog';
import FancySelect from '../ui/FancySelect';
import type { TripCollection } from '../../types';

interface GuideChecklistGenerationDialogProps {
  open: boolean;
  selectedTripId: string;
  trips: TripCollection[];
  checklistGenerating: boolean;
  onClose: () => void;
  onSelectedTripIdChange: (tripId: string) => void;
  onConfirm: () => void;
}

export function GuideChecklistGenerationDialog({
  open,
  selectedTripId,
  trips,
  checklistGenerating,
  onClose,
  onSelectedTripIdChange,
  onConfirm,
}: GuideChecklistGenerationDialogProps) {
  return (
    <Dialog
      open={open}
      eyebrow="攻略清单化"
      title="选择要绑定的行程"
      description="系统会优先读取攻略正文，再自动帮你生成一版“出发前 / 旅途中 / 已完成”三段清单。"
      onClose={onClose}
    >
      <div className="dialog-form">
        <label className="dialog-field">
          <span className="dialog-field-label">目标行程</span>
          <FancySelect
            value={selectedTripId}
            options={trips.map((trip) => ({
              value: trip.id,
              label: trip.name,
            }))}
            onChange={onSelectedTripIdChange}
            placeholder="选择目标行程"
            ariaLabel="选择要绑定的目标行程"
            className="guide-search-trip-select"
            triggerClassName="guide-search-trip-select-trigger"
            menuClassName="guide-search-trip-select-menu"
            usePortal
          />
        </label>
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onConfirm}
            disabled={!selectedTripId || checklistGenerating}
          >
            {checklistGenerating ? '正在生成...' : '生成行前清单'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
