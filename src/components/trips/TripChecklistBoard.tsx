import { useMemo, useState } from 'react';
import FancySelect from '../ui/FancySelect';
import type {
  CreateTripChecklistItemInput,
  UpdateTripChecklistItemInput,
} from '../../lib/api/types';
import type {
  TripChecklistGroup,
  TripChecklistItem,
  TripChecklistStage,
  TripChecklistSummary,
} from '../../types';

const CHECKLIST_STAGE_OPTIONS: Array<{ value: TripChecklistStage; label: string }> = [
  { value: 'pre_departure', label: '出发前准备' },
  { value: 'in_transit', label: '旅途中留意' },
  { value: 'done', label: '已经完成' },
];

interface TripChecklistBoardProps {
  activeCompanionId: string;
  summary: TripChecklistSummary;
  groups: TripChecklistGroup[];
  loading?: boolean;
  busy?: boolean;
  feedbackMessage?: string;
  emptyMessage?: string;
  onCreateItem: (input: CreateTripChecklistItemInput) => Promise<void> | void;
  onUpdateItem: (itemId: string, input: UpdateTripChecklistItemInput) => Promise<void> | void;
  onDeleteItem: (itemId: string) => Promise<void> | void;
  onOpenExpanded?: () => void;
}

export default function TripChecklistBoard({
  activeCompanionId,
  summary,
  groups,
  loading = false,
  busy = false,
  feedbackMessage = '',
  emptyMessage = '还没有生成任何行前清单，可以从攻略搜索结果里直接生成。',
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onOpenExpanded,
}: TripChecklistBoardProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newStage, setNewStage] = useState<TripChecklistStage>('pre_departure');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingNote, setEditingNote] = useState('');

  const hasItems = summary.total > 0;
  const summaryCards = useMemo(
    () => [
      { label: '总条目', value: summary.total },
      { label: '出发前', value: summary.preDepartureCount },
      { label: '旅途中', value: summary.inTransitCount },
      { label: '已完成', value: summary.doneCount },
    ],
    [summary],
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      return;
    }

    await onCreateItem({
      companionId: activeCompanionId,
      title: newTitle.trim(),
      note: newNote.trim() || undefined,
      stage: newStage,
    });

    setNewTitle('');
    setNewNote('');
    setNewStage('pre_departure');
  };

  const startEditing = (item: TripChecklistItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
    setEditingNote(item.note ?? '');
  };

  const saveEditing = async () => {
    if (!editingItemId || !editingTitle.trim()) {
      return;
    }

    await onUpdateItem(editingItemId, {
      title: editingTitle.trim(),
      note: editingNote.trim() || null,
    });
    setEditingItemId(null);
    setEditingTitle('');
    setEditingNote('');
  };

  return (
    <section className="trip-checklist-board">
      <div className="trip-checklist-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="trip-checklist-summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="trip-checklist-board-top">
        <div>
          <h3>行前清单</h3>
          <p>把这次旅程的准备事项、路上提醒和已完成事项收在一起。</p>
        </div>
        {onOpenExpanded ? (
          <button type="button" className="ghost-button" onClick={onOpenExpanded}>
            放大查看
          </button>
        ) : null}
      </div>

      <form
        className="trip-checklist-create-card"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <div className="trip-checklist-create-row">
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            className="field-control"
            placeholder="例如：提前确认景点预约、机场到市区交通、需要带的装备"
          />
          <FancySelect
            value={newStage}
            options={CHECKLIST_STAGE_OPTIONS}
            onChange={(value) => setNewStage(value as TripChecklistStage)}
            placeholder="选择阶段"
            ariaLabel="选择新清单项所属阶段"
            className="trip-checklist-stage-select"
            triggerClassName="trip-checklist-stage-trigger"
            menuClassName="trip-checklist-stage-menu"
            usePortal
          />
        </div>
        <textarea
          value={newNote}
          onChange={(event) => setNewNote(event.target.value)}
          className="field-control trip-checklist-note-textarea"
          rows={3}
          placeholder="可选：补充一句为什么要做，或者要留意的细节。"
        />
        <div className="trip-checklist-create-actions">
          <button type="submit" className="primary-button" disabled={!newTitle.trim() || busy}>
            {busy ? '处理中...' : '新增清单项'}
          </button>
        </div>
      </form>

      {feedbackMessage ? <div className="trip-checklist-feedback">{feedbackMessage}</div> : null}

      {loading ? <div className="trip-checklist-empty">正在整理这次行程的清单...</div> : null}

      {!loading && !hasItems ? <div className="trip-checklist-empty">{emptyMessage}</div> : null}

      {!loading && hasItems ? (
        <div className="trip-checklist-groups">
          {groups.map((group) => (
            <section key={group.stage} className="trip-checklist-group">
              <header className="trip-checklist-group-header">
                <div>
                  <strong>{group.title}</strong>
                  <p>{group.description}</p>
                </div>
                <span>{group.itemCount} 条</span>
              </header>

              <div className="trip-checklist-item-list">
                {group.items.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <article key={item.id} className="trip-checklist-item-card">
                      <div className="trip-checklist-item-top">
                        <div className="trip-checklist-item-head">
                          <span
                            className="trip-checklist-companion-badge"
                            style={{
                              backgroundColor: `${item.companionColor}14`,
                              color: item.companionColor,
                            }}
                          >
                            {item.companionName}
                          </span>
                          <span className="trip-checklist-item-origin">
                            {item.origin === 'generated' ? '攻略生成' : '手动添加'}
                          </span>
                        </div>
                        <FancySelect
                          value={item.stage}
                          options={CHECKLIST_STAGE_OPTIONS}
                          onChange={(value) =>
                            void onUpdateItem(item.id, {
                              stage: value as TripChecklistStage,
                            })
                          }
                          placeholder="选择阶段"
                          ariaLabel={`调整 ${item.title} 的阶段`}
                          className="trip-checklist-stage-select trip-checklist-stage-select-inline"
                          triggerClassName="trip-checklist-stage-trigger"
                          menuClassName="trip-checklist-stage-menu"
                          usePortal
                        />
                      </div>

                      {isEditing ? (
                        <div className="trip-checklist-item-edit">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            className="field-control"
                          />
                          <textarea
                            value={editingNote}
                            onChange={(event) => setEditingNote(event.target.value)}
                            className="field-control trip-checklist-note-textarea"
                            rows={3}
                          />
                          <div className="trip-checklist-item-actions">
                            <button type="button" className="ghost-button" onClick={() => setEditingItemId(null)}>
                              取消
                            </button>
                            <button type="button" className="primary-button" onClick={() => void saveEditing()}>
                              保存修改
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <strong className="trip-checklist-item-title">{item.title}</strong>
                          {item.note ? <p className="trip-checklist-item-note">{item.note}</p> : null}
                          {item.sourceGuideTitle || item.sourceSnippet ? (
                            <div className="trip-checklist-item-source">
                              {item.sourceGuideTitle ? <span>来源：{item.sourceGuideTitle}</span> : null}
                              {item.sourceSnippet ? <p>{item.sourceSnippet}</p> : null}
                            </div>
                          ) : null}
                          <div className="trip-checklist-item-actions">
                            <button type="button" className="ghost-button" onClick={() => startEditing(item)}>
                              编辑
                            </button>
                            <button
                              type="button"
                              className="ghost-button trip-checklist-danger-button"
                              onClick={() => void onDeleteItem(item.id)}
                            >
                              删除
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
