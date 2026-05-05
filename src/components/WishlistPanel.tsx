import { useMemo, useState } from 'react';
import type { Scope, UserProfile, WishlistItem, WishlistPriority } from '../types';
import type { UpdateWishlistItemInput } from '../lib/api/types';
import FancySelect from './ui/FancySelect';

interface WishlistPanelProps {
  items: WishlistItem[];
  users: UserProfile[];
  activeUserId: string;
  onUpdate: (wishlistId: string, input: UpdateWishlistItemInput) => Promise<WishlistItem> | void;
  onConvertToTrip: (wishlistId: string) => Promise<void> | void;
  onDelete: (wishlistId: string) => void;
}

type PriorityFilter = WishlistPriority | 'all';
type ScopeFilter = Scope | 'all';
type SortMode = 'created_desc' | 'priority_desc' | 'target_year_asc';

const priorityLabel: Record<WishlistPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityRank: Record<WishlistPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const priorityOptions = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
];

const scopeOptions = [
  { value: 'all', label: '全部范围' },
  { value: 'domestic', label: '国内' },
  { value: 'international', label: '国际' },
];

const sortOptions = [
  { value: 'created_desc', label: '最近加入' },
  { value: 'priority_desc', label: '优先级最高' },
  { value: 'target_year_asc', label: '目标年份最近' },
];

function buildDraft(item: WishlistItem): UpdateWishlistItemInput {
  return {
    title: item.title,
    city: item.city,
    note: item.note ?? '',
    priority: item.priority,
    targetYear: item.targetYear ?? '',
  };
}

export default function WishlistPanel({
  items,
  users,
  activeUserId,
  onUpdate,
  onConvertToTrip,
  onDelete,
}: WishlistPanelProps) {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('created_desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UpdateWishlistItemInput>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const userMap = new Map(users.map((user) => [user.id, user]));

  const visibleItems = useMemo(() => {
    const filtered = items
      .filter((item) => item.companionId === activeUserId)
      .filter((item) => priorityFilter === 'all' || item.priority === priorityFilter)
      .filter((item) => scopeFilter === 'all' || item.scope === scopeFilter);

    return [...filtered].sort((left, right) => {
      if (sortMode === 'priority_desc') {
        return priorityRank[right.priority] - priorityRank[left.priority] || right.createdAt.localeCompare(left.createdAt);
      }
      if (sortMode === 'target_year_asc') {
        return (left.targetYear ?? '9999').localeCompare(right.targetYear ?? '9999') || right.createdAt.localeCompare(left.createdAt);
      }
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [activeUserId, items, priorityFilter, scopeFilter, sortMode]);

  const startEditing = (item: WishlistItem) => {
    setEditingId(item.id);
    setDraft(buildDraft(item));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEditing = async (item: WishlistItem) => {
    setBusyId(item.id);
    try {
      await onUpdate(item.id, {
        title: draft.title?.trim() || item.title,
        city: draft.city?.trim() || item.city,
        note: draft.note?.trim() || null,
        priority: draft.priority ?? item.priority,
        targetYear: draft.targetYear?.trim() || null,
      });
      cancelEditing();
    } finally {
      setBusyId(null);
    }
  };

  const convertToTrip = async (item: WishlistItem) => {
    setBusyId(item.id);
    try {
      await onConvertToTrip(item.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card sidebar-section wishlist-panel">
      <div className="sidebar-section-heading">
        <div>
          <h3>愿望地图</h3>
          <p>先收下想去的地方，之后再整理进行程规划。</p>
        </div>
        <span className="sidebar-count">{visibleItems.length}</span>
      </div>

      <div className="wishlist-filter-row">
        <FancySelect
          value={priorityFilter}
          onChange={(value) => setPriorityFilter(value as PriorityFilter)}
          options={priorityOptions}
          placeholder="全部优先级"
          ariaLabel="愿望优先级筛选"
          triggerClassName="wishlist-select"
        />
        <FancySelect
          value={scopeFilter}
          onChange={(value) => setScopeFilter(value as ScopeFilter)}
          options={scopeOptions}
          placeholder="全部范围"
          ariaLabel="愿望范围筛选"
          triggerClassName="wishlist-select"
        />
        <FancySelect
          value={sortMode}
          onChange={(value) => setSortMode(value as SortMode)}
          options={sortOptions}
          placeholder="排序"
          ariaLabel="愿望排序"
          triggerClassName="wishlist-select"
        />
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-state compact">地图区域或攻略结果都可以加入愿望。</div>
      ) : (
        <div className="wishlist-list">
          {visibleItems.map((item) => {
            const user = userMap.get(item.companionId);
            const isEditing = editingId === item.id;
            const isBusy = busyId === item.id;
            return (
              <article key={item.id} className="wishlist-card">
                <div className="wishlist-card-main">
                  <strong>{item.title}</strong>
                  <span>{item.scopeName} · {item.city}</span>
                </div>
                <div className="wishlist-card-meta">
                  <span>优先级 {priorityLabel[item.priority]}</span>
                  <span>{item.scope === 'domestic' ? '国内' : '国际'}</span>
                  {item.targetYear ? <span>{item.targetYear}</span> : null}
                  {user ? <span>{user.name}</span> : null}
                </div>
                {(item.importedTrips ?? []).length > 0 ? (
                  <div className="wishlist-imported-state">
                    已导入：{(item.importedTrips ?? []).map((trip) => trip.name).join('、')}
                  </div>
                ) : null}
                {item.note ? <p>{item.note}</p> : null}

                {isEditing ? (
                  <div className="wishlist-edit-form">
                    <input
                      className="field-control"
                      value={draft.title ?? ''}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="愿望标题"
                    />
                    <input
                      className="field-control"
                      value={draft.city ?? ''}
                      onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                      placeholder="城市"
                    />
                    <FancySelect
                      value={draft.priority ?? item.priority}
                      onChange={(value) => setDraft((current) => ({ ...current, priority: value as WishlistPriority }))}
                      options={priorityOptions.filter((option) => option.value !== 'all')}
                      placeholder="优先级"
                      ariaLabel="编辑愿望优先级"
                      triggerClassName="wishlist-select"
                    />
                    <input
                      className="field-control"
                      value={draft.targetYear ?? ''}
                      onChange={(event) => setDraft((current) => ({ ...current, targetYear: event.target.value }))}
                      placeholder="目标年份，例如 2026"
                      inputMode="numeric"
                    />
                    <textarea
                      className="field-control"
                      value={draft.note ?? ''}
                      onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                      placeholder="备注"
                      rows={2}
                    />
                    <div className="wishlist-card-actions">
                      <button type="button" className="primary-button" disabled={isBusy} onClick={() => void saveEditing(item)}>
                        保存
                      </button>
                      <button type="button" className="ghost-button" disabled={isBusy} onClick={cancelEditing}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wishlist-card-actions">
                    <button type="button" className="ghost-button" disabled={isBusy} onClick={() => startEditing(item)}>
                      编辑
                    </button>
                    <button type="button" className="ghost-button" disabled={isBusy} onClick={() => void convertToTrip(item)}>
                      转成行程
                    </button>
                    <button type="button" className="ghost-button wishlist-delete-button" disabled={isBusy} onClick={() => onDelete(item.id)}>
                      移除
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
