import { useMemo, useState } from 'react';
import FancySelect from './FancySelect';
import type { Scope, UserProfile, VisitMarker } from '../types';

function formatVisitedRange(marker: VisitMarker) {
  return marker.visitedStartAt === marker.visitedEndAt
    ? marker.visitedStartAt
    : `${marker.visitedStartAt} - ${marker.visitedEndAt}`;
}

interface MarkerListProps {
  scope: Scope;
  markers: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  onDelete: (markerId: string) => void;
}

export function MarkerList({ scope, markers, users, activeUserId, onDelete }: MarkerListProps) {
  const [filterUserId, setFilterUserId] = useState<'all' | string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);

  const visibleMarkers = useMemo(() => {
    const list = [...markers].sort((a, b) => {
      const endCompare = b.visitedEndAt.localeCompare(a.visitedEndAt);
      if (endCompare !== 0) {
        return endCompare;
      }
      return b.visitedStartAt.localeCompare(a.visitedStartAt);
    });
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
        <label className="field compact-field">
          <span className="field-label">筛选用户</span>
          <FancySelect
            value={filterUserId}
            onChange={setFilterUserId}
            placeholder="全部用户"
            options={[
              { value: 'all', label: '全部用户' },
              ...users.map((user) => ({
                value: user.id,
                label: user.name,
              })),
            ]}
          />
        </label>
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
              <article key={marker.id} className="marker-item">
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
                    title={canDelete ? '删除当前记录' : '仅当前记录所属用户可删除'}
                    onClick={() => onDelete(marker.id)}
                  >
                    删除
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MarkerList;
