import { useEffect, useMemo, useState } from 'react';
import FancySelect from './ui/FancySelect';
import { formatVisitedRange } from '../lib/date';
import { getDateOnlyYear } from '../lib/date';
import {
  MARKER_BUDGET_LEVEL_LABELS,
  MARKER_MOOD_LABELS,
  MARKER_TAG_LABELS,
  MARKER_TRANSPORT_LABELS,
  MARKER_WEATHER_LABELS,
} from '../lib/markerMetadata';
import { sortMarkersDesc } from '../lib/markerSorting';
import type { Scope, UserProfile, VisitMarker } from '../types';
import type { MarkerSearchResponseDto, SearchMarkersQuery } from '../lib/api/types';

interface MarkerListProps {
  scope: Scope;
  markers: VisitMarker[];
  allMarkers?: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  onDelete: (markerId: string) => void;
  onViewDetail: (markerId: string) => void;
  onFocusSearchResult?: (markerId: string) => void;
  onOpenDataSync?: () => void;
  onSearchMarkers?: (query: SearchMarkersQuery) => Promise<MarkerSearchResponseDto>;
}

export function MarkerList({
  scope,
  markers,
  allMarkers,
  users,
  activeUserId,
  onDelete,
  onViewDetail,
  onFocusSearchResult,
  onOpenDataSync,
  onSearchMarkers,
}: MarkerListProps) {
  const [filterUserId, setFilterUserId] = useState<'all' | string>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [yearFilter, setYearFilter] = useState<'all' | string>('all');
  const [scopeFilter, setScopeFilter] = useState<Scope | 'all'>(scope);
  const [searchResult, setSearchResult] = useState<MarkerSearchResponseDto | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);
  const yearSourceMarkers = allMarkers ?? markers;
  const yearOptions = useMemo(() => {
    return Array.from(new Set(yearSourceMarkers.map((item) => getDateOnlyYear(item.visitedStartAt)))).sort(
      (left, right) => right.localeCompare(left),
    );
  }, [yearSourceMarkers]);

  useEffect(() => {
    setScopeFilter(scope);
  }, [scope]);

  const hasServerSearchFilters =
    keyword.trim().length > 0 || filterUserId !== 'all' || yearFilter !== 'all' || scopeFilter !== scope;

  useEffect(() => {
    if (!hasServerSearchFilters || !onSearchMarkers) {
      setSearchResult(null);
      setSearching(false);
      setSearchError('');
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError('');
    onSearchMarkers({
      keyword: keyword.trim() || undefined,
      companionId: filterUserId === 'all' ? undefined : filterUserId,
      scope: scopeFilter,
      year: yearFilter === 'all' ? undefined : yearFilter,
      page: 1,
      pageSize: 20,
    })
      .then((result) => {
        if (!cancelled) {
          setSearchResult(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSearchResult({ items: [], page: 1, pageSize: 20, total: 0, hasMore: false });
          setSearchError(error instanceof Error ? error.message : '旅行记录搜索暂时不可用');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filterUserId, hasServerSearchFilters, keyword, onSearchMarkers, scopeFilter, yearFilter]);

  const visibleMarkers = useMemo(() => {
    if (hasServerSearchFilters) {
      return searchResult?.items ?? [];
    }

    const list = [...markers].sort(sortMarkersDesc);
    return list;
  }, [hasServerSearchFilters, markers, searchResult]);

  const clearFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setFilterUserId('all');
    setYearFilter('all');
    setScopeFilter(scope);
  };

  const submitKeywordSearch = () => {
    setKeyword(keywordInput.trim());
  };

  const openMarker = (markerId: string) => {
    if (hasServerSearchFilters && onFocusSearchResult) {
      onFocusSearchResult(markerId);
      return;
    }
    onViewDetail(markerId);
  };

  return (
    <section className="card panel-card stack gap-16 marker-record-card">
      <div className="section-heading marker-list-heading">
        <div className="marker-list-title-block">
          <h3>{scope === 'domestic' ? '国内旅行记录' : '国际旅行记录'}</h3>
          <p>按时间查看当前范围下的所有标记，支持服务端全文搜索、筛选和删除。</p>
        </div>
      </div>
      <div className="marker-list-controls">
        <label className="marker-search-field">
          <span className="marker-user-filter-label">搜索记录</span>
          <input
            type="search"
            className="field-control marker-search-input"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitKeywordSearch();
              }
            }}
            placeholder="地区、城市或游记关键词"
            aria-label="搜索旅行记录"
          />
        </label>
        <div className="marker-user-filter">
          <span className="marker-user-filter-label">旅伴</span>
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
        <div className="marker-user-filter">
          <span className="marker-user-filter-label">范围</span>
          <FancySelect
            value={scopeFilter}
            onChange={(value) => {
              if (value === 'all' || value === 'domestic' || value === 'international') {
                setScopeFilter(value);
              }
            }}
            placeholder="当前范围"
            className="marker-user-filter-select"
            triggerClassName="marker-user-filter-trigger"
            options={[
              { value: scope, label: scope === 'domestic' ? '当前：国内' : '当前：国际' },
              { value: 'all', label: '全部范围' },
              { value: 'domestic', label: '国内旅行' },
              { value: 'international', label: '国际旅行' },
            ].filter((option, index, list) => list.findIndex((item) => item.value === option.value) === index)}
          />
        </div>
        <div className="marker-user-filter">
          <span className="marker-user-filter-label">年份</span>
          <FancySelect
            value={yearFilter}
            onChange={setYearFilter}
            placeholder="全部年份"
            className="marker-user-filter-select"
            triggerClassName="marker-user-filter-trigger"
            options={[
              { value: 'all', label: '全部年份' },
              ...yearOptions.map((year) => ({
                value: year,
                label: year,
              })),
            ]}
          />
        </div>
        <div className="marker-toolbar-actions">
          {hasServerSearchFilters ? (
            <button type="button" className="ghost-button marker-secondary-action" onClick={clearFilters}>
              清空筛选
            </button>
          ) : null}
          {onOpenDataSync ? (
            <button type="button" className="ghost-button marker-sync-entry-button" onClick={onOpenDataSync}>
              数据备份与恢复
            </button>
          ) : null}
          </div>
        </div>

      {searching ? (
        <div className="empty-state">正在从服务端搜索旅行记录...</div>
      ) : visibleMarkers.length === 0 ? (
        <div className="empty-state">
          {hasServerSearchFilters
            ? searchError || '当前筛选条件下暂无记录。'
            : '当前范围下还没有旅行记录，点击地图或直接使用表单新增第一条标记。'}
          {hasServerSearchFilters ? (
            <button type="button" className="marker-clear-inline-button" onClick={clearFilters}>
              清空筛选
            </button>
          ) : null}
        </div>
      ) : (
        <div className="marker-list">
          {visibleMarkers.map((marker) => {
            const user = userMap.get(marker.userId);
            const canDelete = marker.userId === activeUserId;
            const hasLongNote = marker.note.trim().length > 54;
            const isExpanded = !!expandedNotes[marker.id];
            const imageUrls = marker.imageUrls ?? [];
            const tagSummary = (marker.tags ?? []).slice(0, 3).map((tag) => MARKER_TAG_LABELS[tag].zh);
            const metadataSummary = [
              marker.mood ? `心情 ${MARKER_MOOD_LABELS[marker.mood].zh}` : null,
              marker.weather ? `天气 ${MARKER_WEATHER_LABELS[marker.weather].zh}` : null,
              marker.transport ? `交通 ${MARKER_TRANSPORT_LABELS[marker.transport].zh}` : null,
              marker.budgetLevel ? `预算 ${MARKER_BUDGET_LEVEL_LABELS[marker.budgetLevel].zh}` : null,
            ].filter(Boolean);

            return (
              <article
                key={marker.id}
                className="marker-item marker-item-clickable"
                onClick={() => openMarker(marker.id)}
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
                {tagSummary.length > 0 || metadataSummary.length > 0 ? (
                  <div className="marker-rich-meta">
                    {tagSummary.length > 0 ? (
                      <div className="marker-tag-list" aria-label="记录标签">
                        {tagSummary.map((tag) => (
                          <span key={`${marker.id}-${tag}`} className="marker-tag-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {metadataSummary.length > 0 ? (
                      <div className="marker-metadata-line" aria-label="旅行体验摘要">
                        {metadataSummary.map((item) => (
                          <span key={`${marker.id}-${item}`} className="marker-metadata-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
                      openMarker(marker.id);
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
