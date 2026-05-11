import Dialog from '../ui/Dialog';
import FancySelect from '../ui/FancySelect';
import type { Scope, TripCollection } from '../../types';

export interface GuidePlanningDraft {
  tripId: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  plannedDate: string;
}

interface GuidePlanningDialogProps {
  open: boolean;
  planningSaving: boolean;
  planningDraft: GuidePlanningDraft;
  trips: TripCollection[];
  onClose: () => void;
  onPlanningDraftChange: (draft: GuidePlanningDraft) => void;
  onConfirm: () => void;
}

export function GuidePlanningDialog({
  open,
  planningSaving,
  planningDraft,
  trips,
  onClose,
  onPlanningDraftChange,
  onConfirm,
}: GuidePlanningDialogProps) {
  const updateDraft = (updates: Partial<GuidePlanningDraft>) => {
    onPlanningDraftChange({ ...planningDraft, ...updates });
  };

  return (
    <Dialog
      open={open}
      eyebrow="行前规划"
      title="加入行程规划"
      description="把攻略先收成一个想去地点，之后可以在行程详情里补日期、备注并转成正式记录。"
      onClose={onClose}
    >
      <div className="dialog-form">
        <label className="dialog-field">
          <span className="dialog-field-label">目标行程</span>
          <FancySelect
            value={planningDraft.tripId}
            options={trips.map((trip) => ({ value: trip.id, label: trip.name }))}
            onChange={(tripId) => updateDraft({ tripId })}
            placeholder="选择目标行程"
            ariaLabel="选择规划目标行程"
            className="guide-search-trip-select"
            triggerClassName="guide-search-trip-select-trigger"
            menuClassName="guide-search-trip-select-menu"
            usePortal
          />
        </label>
        <div className="dialog-field-grid">
          <input
            className="field-control"
            value={planningDraft.scopeName}
            onChange={(event) => updateDraft({ scopeName: event.target.value })}
            placeholder="地区/国家"
          />
          <input
            className="field-control"
            value={planningDraft.scopeId}
            onChange={(event) => updateDraft({ scopeId: event.target.value })}
            placeholder="地区编码"
          />
          <input
            className="field-control"
            value={planningDraft.city}
            onChange={(event) => updateDraft({ city: event.target.value })}
            placeholder="城市"
          />
          <input
            className="field-control"
            type="date"
            value={planningDraft.plannedDate}
            onChange={(event) => updateDraft({ plannedDate: event.target.value })}
            aria-label="预计日期"
          />
        </div>
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={
              !planningDraft.tripId ||
              !planningDraft.scopeName.trim() ||
              !planningDraft.scopeId.trim() ||
              !planningDraft.city.trim() ||
              planningSaving
            }
            onClick={onConfirm}
          >
            {planningSaving ? '保存中...' : '加入规划'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
