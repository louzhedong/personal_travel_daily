import { useMemo, useState } from 'react';
import FancySelect from './ui/FancySelect';
import { formatVisitedRange } from '../lib/date';
import { sortMarkersDesc } from '../lib/markerSorting';
import type { Scope, UserProfile, VisitMarker } from '../types';

interface MarkerListProps {
  scope: Scope;
  markers: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  onDelete: (markerId: string) => void;
  onViewDetail: (markerId: string) => void;
  onOpenDataSync?: () => void;
}

export function MarkerList({
  scope,
  markers,
  users,
  activeUserId,
  onDelete,
  onViewDetail,
  onOpenDataSync,
}: MarkerListProps) {
  const [filterUserId, setFilterUserId] = useState<'all' | string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);

  const visibleMarkers = useMemo(() => {
    const list = [...markers].sort(sortMarkersDesc);
    if (filterUserId === 'all') {
      return list;
    }
    return list.filter((item) => item.userId === filterUserId);
  }, [filterUserId, markers]);

  return (
    <section className="card panel-card stack gap-16">
      <div className="section-heading">
        <div>
          <h3>{scope === 'domestic' ? '国内旅行记录' : '国际旅行记录'}</h3>
          <p>按时间查看当前范围下的所有标记，支持按用户筛选和删除。</p>
        </div>
        <div className="marker-list-controls">
          <div className="marker-user-filter">
            <span className="marker-user-filter-label">筛选旅伴</span>
            <FancySelect
              value={filterUserId}
              onChange={setFilterUserId}
              placeholder="全部用户"
              className="marker-user-filter-select"
              triggerClassName="marker-user-filter-trigger"
              options={[
                { value: 'all', label: '全部用户' },
                ...users.map((user) => ({
                  value: user.id,
                  label: user.name,
                })),
              ]}
            />
          </div>
          {onOpenDataSync ? (
            <button type="button" className="ghost-button marker-sync-entry-button" onClick={onOpenDataSync}>
              数据备份与恢复
            </button>
          ) : null}
        </div>
      </div>

      {visibleMarkers.length === 0 ? (
        <div className="empty-state">
          当前范围下还没有旅行记录，点击地图或直接使用表单新增第一条标记。
        </div>
      ) : (
        <div className="marker-list">
          {visibleMarkers.map((marker) => {
            const user = userMap.get(marker.userId);
            const canDelete = marker.userId === activeUserId;
            const hasLongNote = marker.note.trim().length > 54;
            const isExpanded = !!expandedNotes[marker.id];
            const imageUrls = marker.imageUrls ?? [];

            return (
              <article
                key={marker.id}
                className="marker-item marker-item-clickable"
                onClick={() => onViewDetail(marker.id)}
              >
                <div className="marker-item-header">
                  <div className="stack gap-8 marker-content-main">
                    <div className="marker-chip-row">
                      <span className="marker-scope-tag">
                        {marker.scope === 'domestic' ? '国内旅行' : '国际旅行'}
                      </span>
                    </div>
                    <div className="marker-title-row">
                      <strong className="marker-place">{marker.scopeName}</strong>
                      <span className="marker-separator">/</span>
                      <span className="marker-city">{marker.city}</span>
                    </div>
                    <div className="marker-meta-row marker-meta-row-primary">
                      <span className="user-pill" style={{ borderColor: user?.color ?? '#cbd5e1' }}>
                        <span className="color-dot" style={{ backgroundColor: user?.color ?? '#94a3b8' }} />
                        {user?.name ?? '未知用户'}
                      </span>
                      <span className="marker-date-badge">{formatVisitedRange(marker)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ghost-button marker-delete-button"
                    disabled={!canDelete}
                    title={canDelete ? '删除当前记录' : '切换到该旅伴后可删除'}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(marker.id);
                    }}
                  >
                    {canDelete ? '删除' : '仅本人可删'}
                  </button>
                </div>
                <div className="marker-note-block">
                  <p className={isExpanded ? 'marker-note expanded' : 'marker-note'}>
                    {marker.note || '这条记录还没有填写游玩描述。'}
                  </p>
                  {hasLongNote ? (
                    <button
                      type="button"
                      className="marker-note-toggle"
                      onClick={() =>
                        setExpandedNotes((current) => ({
                          ...current,
                          [marker.id]: !current[marker.id],
                        }))
                      }
                    >
                      {isExpanded ? '收起' : '展开'}
                    </button>
                  ) : null}
                </div>
                {imageUrls.length > 0 ? (
                  <div className="marker-image-block">
                    <div className="marker-image-block-header">
                      <span className="marker-image-title">旅行图片</span>
                      <span className="marker-image-count">{imageUrls.length} 张</span>
                    </div>
                    <div className="marker-image-grid">
                      {imageUrls.map((imageUrl, index) => (
                        <a
                          key={`${marker.id}-${imageUrl}-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="marker-image-link"
                          aria-label={`查看 ${marker.scopeName}-${marker.city} 的第 ${index + 1} 张原图`}
                        >
                          <img src={imageUrl} alt={`${marker.scopeName}-${marker.city}-${index + 1}`} className="marker-image" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="marker-item-footer">
                  <button
                    type="button"
                    className="marker-detail-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewDetail(marker.id);
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MarkerList;
