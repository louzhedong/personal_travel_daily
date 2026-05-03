import { useMemo, useState } from 'react';
import DateField from '../ui/DateField';
import FancySelect from '../ui/FancySelect';
import type {
  ConvertTripPlanningItemInput,
  CreateTripPlanningItemInput,
  UpdateTripPlanningItemInput,
} from '../../lib/api/types';
import type { Scope, TripPlanningItem, TripPlanningPriority, TripPlanningSummary } from '../../types';

const PRIORITY_OPTIONS: Array<{ value: TripPlanningPriority | 'all'; label: string }> = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
];

const SCOPE_OPTIONS: Array<{ value: Scope; label: string }> = [
  { value: 'domestic', label: '国内' },
  { value: 'international', label: '国际' },
];

const PRIORITY_LABELS: Record<TripPlanningPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

interface TripPlanningBoardProps {
  activeCompanionId: string;
  summary: TripPlanningSummary;
  items: TripPlanningItem[];
  busy?: boolean;
  feedbackMessage?: string;
  onCreateItem: (input: CreateTripPlanningItemInput) => Promise<void> | void;
  onUpdateItem: (itemId: string, input: UpdateTripPlanningItemInput) => Promise<void> | void;
  onDeleteItem: (itemId: string) => Promise<void> | void;
  onConvertItem: (itemId: string, input: ConvertTripPlanningItemInput) => Promise<void> | void;
}

function buildEmptyDraft(activeCompanionId: string): CreateTripPlanningItemInput {
  return {
    companionId: activeCompanionId,
    title: '',
    scope: 'domestic',
    scopeId: '',
    scopeName: '',
    city: '',
    note: '',
    priority: 'medium',
    plannedDate: null,
  };
}

export default function TripPlanningBoard({
  activeCompanionId,
  summary,
  items,
  busy = false,
  feedbackMessage = '',
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onConvertItem,
}: TripPlanningBoardProps) {
  const [draft, setDraft] = useState<CreateTripPlanningItemInput>(() => buildEmptyDraft(activeCompanionId));
  const [priorityFilter, setPriorityFilter] = useState<TripPlanningPriority | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [convertId, setConvertId] = useState<string | null>(null);
  const [convertStartAt, setConvertStartAt] = useState('');
  const [convertEndAt, setConvertEndAt] = useState('');

  const filteredItems = useMemo(
    () => items.filter((item) => priorityFilter === 'all' || item.priority === priorityFilter),
    [items, priorityFilter],
  );

  const canCreate = draft.title.trim() && draft.scopeId.trim() && draft.scopeName.trim() && draft.city.trim();

  return (
    <div className="trip-planning-board">
      <div className="trip-planning-summary">
        <span>全部 {summary.total}</span>
        <span>待去 {summary.plannedCount}</span>
        <span>已转记录 {summary.convertedCount}</span>
        <span>高优先级 {summary.highPriorityCount}</span>
      </div>

      {feedbackMessage ? <p className="trip-planning-feedback">{feedbackMessage}</p> : null}

      <form
        className="trip-planning-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canCreate || busy) {
            return;
          }
          void Promise.resolve(onCreateItem({ ...draft, title: draft.title.trim(), note: draft.note?.trim() }))
            .then(() => setDraft(buildEmptyDraft(activeCompanionId)));
        }}
      >
        <input className="field-control" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="想去地点或事项" />
        <FancySelect
          value={draft.scope}
          onChange={(value) => setDraft({ ...draft, scope: value as Scope })}
          options={SCOPE_OPTIONS}
          placeholder="选择范围"
          ariaLabel="规划范围"
          triggerClassName="trip-planning-select"
        />
        <input className="field-control" value={draft.scopeName} onChange={(event) => setDraft({ ...draft, scopeName: event.target.value })} placeholder="地区/国家" />
        <input className="field-control" value={draft.scopeId} onChange={(event) => setDraft({ ...draft, scopeId: event.target.value })} placeholder="地区编码" />
        <input className="field-control" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="城市" />
        <FancySelect
          value={draft.priority ?? 'medium'}
          onChange={(value) => setDraft({ ...draft, priority: value as TripPlanningPriority })}
          options={PRIORITY_OPTIONS.filter((option) => option.value !== 'all') as Array<{ value: TripPlanningPriority; label: string }>}
          placeholder="选择优先级"
          ariaLabel="规划优先级"
          triggerClassName="trip-planning-select"
        />
        <DateField value={draft.plannedDate ?? ''} ariaLabel="预计日期" onChange={(value) => setDraft({ ...draft, plannedDate: value || null })} />
        <textarea className="field-control trip-planning-note" value={draft.note ?? ''} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="备注" rows={2} />
        <button className="primary-button" type="submit" disabled={!canCreate || busy}>
          添加规划
        </button>
      </form>

      <div className="trip-planning-toolbar">
        <FancySelect
          value={priorityFilter}
          onChange={(value) => setPriorityFilter(value as TripPlanningPriority | 'all')}
          options={PRIORITY_OPTIONS}
          placeholder="筛选优先级"
          ariaLabel="筛选优先级"
          triggerClassName="trip-planning-select"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="trip-detail-empty">还没有行前规划项。</div>
      ) : (
        <div className="trip-planning-list">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const isConverting = convertId === item.id;
            return (
              <article key={item.id} className={`trip-planning-card trip-planning-card-${item.status}`}>
                <div className="trip-planning-card-head">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.scopeName} · {item.city} · {item.scope === 'domestic' ? '国内' : '国际'}</p>
                  </div>
                  <span>{item.status === 'converted' ? '已转记录' : `${PRIORITY_LABELS[item.priority]}优先级`}</span>
                </div>
                <p className="trip-planning-card-note">{item.note || '暂无备注'}</p>
                <div className="trip-planning-card-meta">
                  <span>{item.companionName}</span>
                  <span>{item.plannedDate ?? '未设置预计日期'}</span>
                  {item.sourceGuideTitle ? <span>{item.sourceGuideTitle}</span> : null}
                </div>

                {isEditing ? (
                  <div className="trip-planning-inline-editor">
                    <textarea className="field-control" value={editingNote} onChange={(event) => setEditingNote(event.target.value)} rows={2} />
                    <button type="button" className="primary-button" disabled={busy} onClick={() => {
                      void Promise.resolve(onUpdateItem(item.id, { note: editingNote })).then(() => setEditingId(null));
                    }}>
                      保存
                    </button>
                  </div>
                ) : null}

                {isConverting ? (
                  <div className="trip-planning-convert-row">
                    <DateField value={convertStartAt} max={convertEndAt || undefined} ariaLabel="访问开始日期" onChange={setConvertStartAt} />
                    <DateField value={convertEndAt} min={convertStartAt || undefined} ariaLabel="访问结束日期" onChange={setConvertEndAt} />
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy || !convertStartAt || !convertEndAt || convertEndAt < convertStartAt}
                      onClick={() => {
                        void Promise.resolve(onConvertItem(item.id, { visitedStartAt: convertStartAt, visitedEndAt: convertEndAt })).then(() => {
                          setConvertId(null);
                          setConvertStartAt('');
                          setConvertEndAt('');
                        });
                      }}
                    >
                      确认转记录
                    </button>
                  </div>
                ) : null}

                <div className="trip-planning-card-actions">
                  <button type="button" className="ghost-button" disabled={busy || item.status === 'converted'} onClick={() => {
                    setEditingId(item.id);
                    setEditingNote(item.note ?? '');
                  }}>
                    编辑备注
                  </button>
                  <button type="button" className="ghost-button" disabled={busy || item.status === 'converted'} onClick={() => setConvertId(isConverting ? null : item.id)}>
                    转为记录
                  </button>
                  <button type="button" className="ghost-button trip-detail-action-button-danger" disabled={busy} onClick={() => void onDeleteItem(item.id)}>
                    删除
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
