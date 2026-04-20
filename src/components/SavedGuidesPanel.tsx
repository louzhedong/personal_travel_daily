import { useEffect, useMemo, useRef, useState } from 'react';
import TravelIcon from './TravelIcon';
import type { SavedGuide, UserProfile, VisitMarker } from '../types';

type SavedGuideFilter = 'all' | 'linked' | 'unlinked';

interface SavedGuidesPanelProps {
  savedGuides: SavedGuide[];
  activeUserId: string;
  users: UserProfile[];
  markers: VisitMarker[];
  onOpenMarkerDetail: (markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
}

export default function SavedGuidesPanel({
  savedGuides,
  activeUserId,
  users,
  markers,
  onOpenMarkerDetail,
  onRemoveSavedGuide,
}: SavedGuidesPanelProps) {
  const [filter, setFilter] = useState<SavedGuideFilter>('all');
  const [expanded, setExpanded] = useState(true);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const activeUser = users.find((item) => item.id === activeUserId);

  const markerMap = useMemo(() => new Map(markers.map((item) => [item.id, item])), [markers]);

  const currentUserGuides = useMemo(
    () => savedGuides.filter((item) => item.savedByUserId === activeUserId),
    [activeUserId, savedGuides],
  );

  const visibleGuides = useMemo(() => {
    if (filter === 'linked') {
      return currentUserGuides.filter((item) => !!item.markerId);
    }
    if (filter === 'unlinked') {
      return currentUserGuides.filter((item) => !item.markerId);
    }
    return currentUserGuides;
  }, [currentUserGuides, filter]);

  const summaryText =
    currentUserGuides.length > 0
      ? `已为 ${activeUser?.name ?? '当前旅伴'} 累积 ${currentUserGuides.length} 条攻略灵感。`
      : '先在攻略搜索面板里收藏内容，这里会集中展示你的攻略灵感。';

  useEffect(() => {
    const node = listRef.current;
    if (!node || !expanded) {
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }

    const updateScrollShadow = () => {
      const nextShowTopShadow = node.scrollTop > 4;
      const nextShowBottomShadow = node.scrollTop + node.clientHeight < node.scrollHeight - 4;
      setShowTopShadow(nextShowTopShadow);
      setShowBottomShadow(nextShowBottomShadow);
    };

    updateScrollShadow();
    node.addEventListener('scroll', updateScrollShadow, { passive: true });
    window.addEventListener('resize', updateScrollShadow);

    return () => {
      node.removeEventListener('scroll', updateScrollShadow);
      window.removeEventListener('resize', updateScrollShadow);
    };
  }, [expanded, filter, visibleGuides]);

  return (
    <section className="saved-guides-panel">
      <div className="saved-guides-header">
        <div className="saved-guides-title-row">
          <span className="travel-icon-badge travel-icon-badge-orange saved-guides-icon">
            <TravelIcon name="spark" size={16} />
          </span>
          <div>
            <h3>我的攻略收藏</h3>
            <p>{summaryText}</p>
          </div>
        </div>
        <button
          type="button"
          className={expanded ? 'saved-guides-toggle active' : 'saved-guides-toggle'}
          aria-expanded={expanded}
          aria-controls="saved-guides-drawer"
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="saved-guides-toggle-text">{expanded ? '收起' : '展开'}</span>
          <span className="saved-guides-toggle-arrow" aria-hidden="true">
            ▾
          </span>
        </button>
      </div>

      <div
        id="saved-guides-drawer"
        className={expanded ? 'saved-guides-drawer expanded' : 'saved-guides-drawer'}
      >
        <div className="saved-guides-drawer-inner">
          <div className="saved-guides-filter-row" role="tablist" aria-label="攻略收藏筛选">
            {([
              ['all', '全部'],
              ['linked', '已关联'],
              ['unlinked', '未关联'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={filter === value ? 'guide-filter-chip active' : 'guide-filter-chip'}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleGuides.length > 0 ? (
            <div
              className={`saved-guides-scroll-shell${showTopShadow ? ' has-top-shadow' : ''}${
                showBottomShadow ? ' has-bottom-shadow' : ''
              }`}
            >
              <div ref={listRef} className="saved-guides-list">
                {visibleGuides.map((guide) => {
                  const relatedMarker = guide.markerId ? markerMap.get(guide.markerId) : undefined;
                  return (
                    <article key={guide.id} className="saved-guide-card">
                      <div className="saved-guide-top">
                        <strong>{guide.result.title}</strong>
                        <span>{guide.result.sourceName}</span>
                      </div>

                      <p className="saved-guide-summary">{guide.result.summary}</p>

                      <div className="saved-guide-meta">
                        <span className="saved-guide-pill">{guide.markerId ? '已关联记录' : '独立收藏'}</span>
                        <span className="saved-guide-date">{guide.savedAt.slice(0, 10)}</span>
                      </div>

                      {relatedMarker ? (
                        <div className="saved-guide-linked-marker">
                          关联记录：{relatedMarker.scopeName} · {relatedMarker.city}
                        </div>
                      ) : null}

                      <div className="saved-guide-actions">
                        {relatedMarker ? (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => onOpenMarkerDetail(relatedMarker.id)}
                          >
                            定位记录
                          </button>
                        ) : null}
                        {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                          <a href={guide.result.sourceUrl} target="_blank" rel="noreferrer" className="guide-result-link">
                            查看原文
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => onRemoveSavedGuide(guide.id)}
                        >
                          {guide.markerId ? '移除收藏' : '取消收藏'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="saved-guides-empty">
              {filter === 'all'
                ? '还没有收藏攻略，先去搜索并收藏一篇吧。'
                : filter === 'linked'
                  ? '当前没有已关联到旅行记录的攻略。'
                  : '当前没有未关联记录的独立收藏。'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
