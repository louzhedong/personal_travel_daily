import { useMemo, useState } from 'react';
import TravelIcon from './TravelIcon';
import type { Scope, VisitMarker } from '../types';

type TimelineScopeFilter = Scope | 'all';
type TimelineYearFilter = 'all' | string;

interface TimelineGroup {
  date: string;
  markers: VisitMarker[];
}

interface TripTimelinePanelProps {
  markers: VisitMarker[];
  activeUserId: string;
  activeUserName?: string;
  onOpenMarkerDetail: (markerId: string) => void;
}

function formatVisitedRange(marker: VisitMarker) {
  return marker.visitedStartAt === marker.visitedEndAt
    ? marker.visitedStartAt
    : `${marker.visitedStartAt} - ${marker.visitedEndAt}`;
}

function sortMarkersDesc(left: VisitMarker, right: VisitMarker) {
  return (
    right.visitedStartAt.localeCompare(left.visitedStartAt) ||
    right.visitedEndAt.localeCompare(left.visitedEndAt) ||
    right.createdAt.localeCompare(left.createdAt)
  );
}

export default function TripTimelinePanel({
  markers,
  activeUserId,
  activeUserName,
  onOpenMarkerDetail,
}: TripTimelinePanelProps) {
  const [scopeFilter, setScopeFilter] = useState<TimelineScopeFilter>('all');
  const [yearFilter, setYearFilter] = useState<TimelineYearFilter>('all');

  const currentUserMarkers = useMemo(
    () => markers.filter((item) => item.userId === activeUserId).sort(sortMarkersDesc),
    [activeUserId, markers],
  );

  const yearOptions = useMemo(() => {
    return Array.from(new Set(currentUserMarkers.map((item) => item.visitedStartAt.slice(0, 4)))).sort(
      (left, right) => right.localeCompare(left),
    );
  }, [currentUserMarkers]);

  const filteredMarkers = useMemo(() => {
    return currentUserMarkers.filter((item) => {
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) {
        return false;
      }
      if (yearFilter !== 'all' && item.visitedStartAt.slice(0, 4) !== yearFilter) {
        return false;
      }
      return true;
    });
  }, [currentUserMarkers, scopeFilter, yearFilter]);

  const timelineGroups = useMemo<TimelineGroup[]>(() => {
    const groupMap = new Map<string, VisitMarker[]>();
    filteredMarkers.forEach((marker) => {
      const group = groupMap.get(marker.visitedStartAt) ?? [];
      group.push(marker);
      groupMap.set(marker.visitedStartAt, group);
    });

    return Array.from(groupMap.entries())
      .map(([date, groupedMarkers]) => ({
        date,
        markers: groupedMarkers.sort(sortMarkersDesc),
      }))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [filteredMarkers]);

  const summaryText =
    currentUserMarkers.length > 0
      ? `${activeUserName ?? '当前旅伴'}共有 ${currentUserMarkers.length} 条旅行记录，按时间回看更清晰。`
      : '还没有旅行记录，创建第一条后这里会自动生成时间线。';

  return (
    <section className="trip-timeline-panel">
      <div className="trip-timeline-header">
        <div className="saved-guides-title-row">
          <span className="travel-icon-badge travel-icon-badge-blue saved-guides-icon">
            <TravelIcon name="route" size={16} />
          </span>
          <div>
            <h3>行程时间线</h3>
            <p>{summaryText}</p>
          </div>
        </div>
      </div>

      <div className="trip-timeline-toolbar">
        <div className="saved-guides-filter-row" role="tablist" aria-label="时间线范围筛选">
          {([
            ['all', '全部'],
            ['domestic', '国内'],
            ['international', '国际'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={scopeFilter === value}
              className={scopeFilter === value ? 'guide-filter-chip active' : 'guide-filter-chip'}
              onClick={() => setScopeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="trip-timeline-year-filter">
          <span className="trip-timeline-year-label">时间范围</span>
          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            className="field-control trip-timeline-year-select"
            aria-label="按年份筛选时间线"
          >
            <option value="all">全部年份</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      {timelineGroups.length > 0 ? (
        <div className="trip-timeline-list-shell">
          <div className="trip-timeline-list">
            {timelineGroups.map((group) => (
              <article key={group.date} className="trip-timeline-day-card">
                <div className="trip-timeline-day-header">
                  <strong>{group.date}</strong>
                  <span>{group.markers.length} 条记录</span>
                </div>
                <div className="trip-timeline-day-items">
                  {group.markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      className="trip-timeline-item-button"
                      onClick={() => onOpenMarkerDetail(marker.id)}
                    >
                      <span className="trip-timeline-item-top">
                        <strong>{marker.scopeName} · {marker.city}</strong>
                        <span>{marker.scope === 'domestic' ? '国内' : '国际'}</span>
                      </span>
                      <span className="trip-timeline-item-subtitle">{formatVisitedRange(marker)}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="saved-guides-empty">当前筛选条件下暂无记录。</div>
      )}
    </section>
  );
}
