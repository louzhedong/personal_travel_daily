import { useMemo, useState } from 'react';
import DateField from './ui/DateField';
import Dialog from './ui/Dialog';
import FancySelect from './ui/FancySelect';
import TravelIcon from './ui/TravelIcon';
import { formatDateRange, formatVisitedRange, getDateOnlyYear } from '../lib/date';
import { sortMarkersDesc } from '../lib/markerSorting';
import type { Scope, TripCollection, VisitMarker } from '../types';

type TimelineScopeFilter = Scope | 'all';
type TimelineYearFilter = 'all' | string;

interface TimelineGroup {
  date: string;
  markers: VisitMarker[];
}

interface TripTimelineGroup {
  id: string;
  title: string;
  range: string;
  markers: VisitMarker[];
  startsAt: string;
  coverImageUrl?: string;
}

interface TripTimelinePanelProps {
  markers: VisitMarker[];
  trips: TripCollection[];
  activeUserId: string;
  activeUserName?: string;
  onOpenMarkerDetail: (markerId: string) => void;
  onCreateTrip: (payload: { name: string; startsAt: string; endsAt: string; note?: string }) => void;
}

export default function TripTimelinePanel({
  markers,
  trips,
  activeUserId,
  activeUserName,
  onOpenMarkerDetail,
  onCreateTrip,
}: TripTimelinePanelProps) {
  const [scopeFilter, setScopeFilter] = useState<TimelineScopeFilter>('all');
  const [yearFilter, setYearFilter] = useState<TimelineYearFilter>('all');
  const [tripName, setTripName] = useState('');
  const [tripStartsAt, setTripStartsAt] = useState('');
  const [tripEndsAt, setTripEndsAt] = useState('');
  const [tripNote, setTripNote] = useState('');
  const [createTripOpen, setCreateTripOpen] = useState(false);
  const canSubmitTrip = tripName.trim().length > 0 && !!tripStartsAt && !!tripEndsAt && tripEndsAt >= tripStartsAt;

  const resetTripForm = () => {
    setTripName('');
    setTripStartsAt('');
    setTripEndsAt('');
    setTripNote('');
  };

  const handleCreateTrip = () => {
    const name = tripName.trim();
    if (!canSubmitTrip) {
      return;
    }
    onCreateTrip({
      name,
      startsAt: tripStartsAt,
      endsAt: tripEndsAt,
      note: tripNote.trim() || undefined,
    });
    resetTripForm();
    setCreateTripOpen(false);
  };

  const currentUserMarkers = useMemo(
    () => markers.filter((item) => item.userId === activeUserId).sort(sortMarkersDesc),
    [activeUserId, markers],
  );

  const yearOptions = useMemo(() => {
    return Array.from(new Set(currentUserMarkers.map((item) => getDateOnlyYear(item.visitedStartAt)))).sort(
      (left, right) => right.localeCompare(left),
    );
  }, [currentUserMarkers]);

  const filteredMarkers = useMemo(() => {
    return currentUserMarkers.filter((item) => {
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) {
        return false;
      }
      if (yearFilter !== 'all' && getDateOnlyYear(item.visitedStartAt) !== yearFilter) {
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

  const tripGroups = useMemo<TripTimelineGroup[]>(() => {
    const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
    const grouped = new Map<string, VisitMarker[]>();

    filteredMarkers.forEach((marker) => {
      const key = marker.tripId && tripMap.has(marker.tripId) ? marker.tripId : 'unassigned';
      const next = grouped.get(key) ?? [];
      next.push(marker);
      grouped.set(key, next);
    });

    return Array.from(grouped.entries())
      .map(([tripId, groupedMarkers]) => {
        const trip = tripMap.get(tripId);
        const sortedMarkers = groupedMarkers.sort(sortMarkersDesc);
        const startsAt = trip?.startsAt ?? sortedMarkers[sortedMarkers.length - 1]?.visitedStartAt ?? '';
        const endsAt = trip?.endsAt ?? sortedMarkers[0]?.visitedEndAt ?? '';

        return {
          id: tripId,
          title: trip?.name ?? '未归入行程',
          range: startsAt && endsAt ? formatDateRange(startsAt, endsAt) : '暂无日期',
          markers: sortedMarkers,
          startsAt,
          coverImageUrl: trip?.coverImageUrl,
        };
      })
      .sort((left, right) => right.startsAt.localeCompare(left.startsAt));
  }, [filteredMarkers, trips]);

  const shouldShowTripGroups = trips.length > 0 || filteredMarkers.some((marker) => marker.tripId);

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
        <button
          type="button"
          className="ghost-button trip-create-entry"
          onClick={() => setCreateTripOpen(true)}
        >
          <span className="travel-icon-inline detail-action-icon">
            <TravelIcon name="plus" size={13} />
          </span>
          创建行程
        </button>
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
          <FancySelect
            value={yearFilter}
            onChange={setYearFilter}
            placeholder="全部年份"
            ariaLabel="按年份筛选时间线"
            className="trip-timeline-year-fancy"
            triggerClassName="trip-timeline-year-trigger"
            options={[
              { value: 'all', label: '全部年份' },
              ...yearOptions.map((year) => ({
                value: year,
                label: year,
              })),
            ]}
          />
        </label>
      </div>

      <Dialog
        open={createTripOpen}
        eyebrow="Trip Collection"
        title="创建行程"
        onClose={() => {
          resetTripForm();
          setCreateTripOpen(false);
        }}
      >
        <form
          className="trip-collection-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateTrip();
          }}
        >
          <input
            type="text"
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            className="field-control trip-collection-input"
            placeholder="新建行程，例如 2025 日本春游"
          />
          <div className="trip-collection-date-row">
            <DateField
              value={tripStartsAt}
              max={tripEndsAt || undefined}
              onChange={setTripStartsAt}
              ariaLabel="行程开始日期"
            />
            <DateField
              value={tripEndsAt}
              min={tripStartsAt || undefined}
              onChange={setTripEndsAt}
              ariaLabel="行程结束日期"
            />
          </div>
          <input
            type="text"
            value={tripNote}
            onChange={(event) => setTripNote(event.target.value)}
            className="field-control trip-collection-input"
            placeholder="备注，可选"
          />
          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                resetTripForm();
                setCreateTripOpen(false);
              }}
            >
              取消
            </button>
            <button type="submit" className="primary-button trip-collection-submit" disabled={!canSubmitTrip}>
              创建行程
            </button>
          </div>
        </form>
      </Dialog>

      {shouldShowTripGroups && tripGroups.length > 0 ? (
        <div className="trip-collection-list">
          {tripGroups.map((group) => (
            <article key={group.id} className="trip-collection-card">
              {group.coverImageUrl ? (
                <img src={group.coverImageUrl} alt="" className="trip-collection-cover" />
              ) : null}
              <div className="trip-collection-card-header">
                <strong>{group.title}</strong>
                <span>{group.range} · {group.markers.length} 条记录</span>
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
      ) : timelineGroups.length > 0 ? (
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
