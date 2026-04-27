import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from './ui/ConfirmDialog';
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
  onOpenTripDetail?: (tripId: string) => void;
  onCreateTrip: (payload: { name: string; startsAt: string; endsAt: string; note?: string }) => void;
  onUpdateTrip: (
    tripId: string,
    payload: { name?: string; startsAt?: string; endsAt?: string; note?: string },
  ) => void;
  onDeleteTrip: (tripId: string) => void;
  onBulkAssignMarkersToTrip: (markerIds: string[], tripId?: string | null) => void;
}

export default function TripTimelinePanel({
  markers,
  trips,
  activeUserId,
  activeUserName,
  onOpenMarkerDetail,
  onOpenTripDetail,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onBulkAssignMarkersToTrip,
}: TripTimelinePanelProps) {
  const [scopeFilter, setScopeFilter] = useState<TimelineScopeFilter>('all');
  const [yearFilter, setYearFilter] = useState<TimelineYearFilter>('all');
  const [tripName, setTripName] = useState('');
  const [tripStartsAt, setTripStartsAt] = useState('');
  const [tripEndsAt, setTripEndsAt] = useState('');
  const [tripNote, setTripNote] = useState('');
  const [tripDialogMode, setTripDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<string[]>([]);
  const [batchTripTarget, setBatchTripTarget] = useState('');
  const canSubmitTrip = tripName.trim().length > 0 && !!tripStartsAt && !!tripEndsAt && tripEndsAt >= tripStartsAt;
  const pendingDeleteTrip = pendingDeleteTripId ? trips.find((trip) => trip.id === pendingDeleteTripId) : undefined;

  const resetTripForm = () => {
    setTripName('');
    setTripStartsAt('');
    setTripEndsAt('');
    setTripNote('');
    setEditingTripId(null);
  };

  const closeTripDialog = () => {
    resetTripForm();
    setTripDialogMode(null);
  };

  const openCreateTripDialog = () => {
    resetTripForm();
    setTripDialogMode('create');
  };

  const openEditTripDialog = (trip: TripCollection) => {
    setEditingTripId(trip.id);
    setTripName(trip.name);
    setTripStartsAt(trip.startsAt);
    setTripEndsAt(trip.endsAt);
    setTripNote(trip.note);
    setTripDialogMode('edit');
  };

  const handleSubmitTrip = () => {
    const name = tripName.trim();
    if (!canSubmitTrip || !tripDialogMode) {
      return;
    }

    const payload = {
      name,
      startsAt: tripStartsAt,
      endsAt: tripEndsAt,
      note: tripNote.trim() || undefined,
    };

    if (tripDialogMode === 'create') {
      onCreateTrip(payload);
    } else if (editingTripId) {
      onUpdateTrip(editingTripId, payload);
    }

    closeTripDialog();
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

  useEffect(() => {
    const visibleMarkerIds = new Set(filteredMarkers.map((marker) => marker.id));
    setSelectedMarkerIds((current) => current.filter((markerId) => visibleMarkerIds.has(markerId)));
  }, [filteredMarkers]);

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
  const tripOptions = trips.map((trip) => ({
    value: trip.id,
    label: trip.name,
  }));
  const selectedMarkers = useMemo(
    () =>
      selectedMarkerIds
        .map((markerId) => filteredMarkers.find((marker) => marker.id === markerId))
        .filter((marker): marker is VisitMarker => Boolean(marker)),
    [filteredMarkers, selectedMarkerIds],
  );

  const summaryText =
    currentUserMarkers.length > 0
      ? `${activeUserName ?? '当前旅伴'}共有 ${currentUserMarkers.length} 条旅行记录，按时间回看更清晰。`
      : '还没有旅行记录，创建第一条后这里会自动生成时间线。';

  const toggleMarkerSelection = (markerId: string) => {
    setSelectedMarkerIds((current) =>
      current.includes(markerId) ? current.filter((item) => item !== markerId) : [...current, markerId],
    );
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMarkerIds([]);
    setBatchTripTarget('');
  };

  const handleApplyBatchTrip = () => {
    if (!batchTripTarget || selectedMarkerIds.length === 0) {
      return;
    }

    onBulkAssignMarkersToTrip(selectedMarkerIds, batchTripTarget === 'unassigned' ? null : batchTripTarget);
    handleExitSelectionMode();
  };

  const renderMarkerButton = (marker: VisitMarker) =>
    selectionMode ? (
      <button
        key={marker.id}
        type="button"
        className={
          selectedMarkerIds.includes(marker.id)
            ? 'trip-timeline-item-button is-selecting is-selected'
            : 'trip-timeline-item-button is-selecting'
        }
        onClick={() => toggleMarkerSelection(marker.id)}
      >
        <span className="trip-timeline-item-top">
          <strong>{marker.scopeName} · {marker.city}</strong>
          <span>{selectedMarkerIds.includes(marker.id) ? '已选中' : '点击选择'}</span>
        </span>
        <span className="trip-timeline-item-subtitle">{formatVisitedRange(marker)}</span>
      </button>
    ) : (
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
    );

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
        <div className="trip-timeline-header-actions">
          <button
            type="button"
            className={selectionMode ? 'ghost-button trip-create-entry is-active' : 'ghost-button trip-create-entry'}
            onClick={() => {
              if (selectionMode) {
                handleExitSelectionMode();
                return;
              }
              setSelectionMode(true);
            }}
          >
            <span className="travel-icon-inline detail-action-icon">
              <TravelIcon name="route" size={13} />
            </span>
            {selectionMode ? '退出整理' : '整理记录'}
          </button>
          <button type="button" className="ghost-button trip-create-entry" onClick={openCreateTripDialog}>
            <span className="travel-icon-inline detail-action-icon">
              <TravelIcon name="plus" size={13} />
            </span>
            创建行程
          </button>
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
        {selectionMode ? (
          <div className="trip-batch-toolbar">
            <div className="trip-batch-summary">
              <strong>整理模式</strong>
              <div className="trip-batch-summary-meta">
                <div className="trip-batch-selected-summary-wrap">
                  <span
                    className={selectedMarkers.length > 0 ? 'trip-batch-selected-summary has-tooltip' : 'trip-batch-selected-summary'}
                    tabIndex={selectedMarkers.length > 0 ? 0 : undefined}
                  >
                    已选 {selectedMarkerIds.length} 条记录
                  </span>
                  {selectedMarkers.length > 0 ? (
                    <div
                      role="tooltip"
                      className={
                        selectedMarkers.length > 5
                          ? 'trip-batch-selection-tooltip is-scrollable'
                          : 'trip-batch-selection-tooltip'
                      }
                    >
                      <strong>已选记录</strong>
                      <ul className="trip-batch-selection-tooltip-list">
                        {selectedMarkers.map((marker) => (
                          <li key={marker.id}>
                            <span className="trip-batch-selection-tooltip-primary">
                              {marker.scopeName} · {marker.city}
                            </span>
                            <span className="trip-batch-selection-tooltip-secondary">
                              {formatVisitedRange(marker)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="trip-batch-actions">
              <FancySelect
                value={batchTripTarget}
                onChange={setBatchTripTarget}
                placeholder="选择目标行程"
                ariaLabel="选择批量整理的目标行程"
                triggerClassName="trip-timeline-year-trigger trip-batch-select-trigger"
                options={[
                  { value: 'unassigned', label: '移回未归入行程' },
                  ...tripOptions,
                ]}
              />
              <button
                type="button"
                className="primary-button trip-batch-submit"
                disabled={!batchTripTarget || selectedMarkerIds.length === 0}
                onClick={handleApplyBatchTrip}
              >
                应用整理
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={tripDialogMode !== null}
        eyebrow="Trip Collection"
        title={tripDialogMode === 'edit' ? '编辑行程' : '创建行程'}
        onClose={closeTripDialog}
      >
        <form
          className="trip-collection-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmitTrip();
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
          <textarea
            value={tripNote}
            onChange={(event) => setTripNote(event.target.value)}
            className="field-control trip-collection-input trip-collection-textarea"
            placeholder="备注，可选"
            rows={4}
          />
          <div className="dialog-actions">
            <button type="button" className="ghost-button" onClick={closeTripDialog}>
              取消
            </button>
            <button type="submit" className="primary-button trip-collection-submit" disabled={!canSubmitTrip}>
              {tripDialogMode === 'edit' ? '保存行程' : '创建行程'}
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDeleteTrip)}
        eyebrow="Trip Collection"
        title="确认删除这个行程？"
        description={
          pendingDeleteTrip
            ? `删除「${pendingDeleteTrip.name}」后，不会删除旅行记录，但这些记录会被移回未归入行程。`
            : '删除后不会删除旅行记录，但会解除它们和行程的归属关系。'
        }
        cancelText="先保留"
        confirmText="确认删除"
        onCancel={() => setPendingDeleteTripId(null)}
        onConfirm={() => {
          if (!pendingDeleteTripId) {
            return;
          }
          onDeleteTrip(pendingDeleteTripId);
          setPendingDeleteTripId(null);
        }}
      />

      {shouldShowTripGroups && tripGroups.length > 0 ? (
        <div className="trip-collection-list">
          {tripGroups.map((group) => (
            <article key={group.id} className="trip-collection-card">
              {group.coverImageUrl ? (
                <img src={group.coverImageUrl} alt="" className="trip-collection-cover" />
              ) : null}
              <div className="trip-collection-card-header">
                <div>
                  <strong>{group.title}</strong>
                  <span>{group.range} · {group.markers.length} 条记录</span>
                </div>
                <div className="trip-collection-card-actions">
                  {group.id !== 'unassigned' && onOpenTripDetail ? (
                    <button type="button" className="ghost-button trip-card-action-button" onClick={() => onOpenTripDetail(group.id)}>
                      查看详情
                    </button>
                  ) : null}
                  {group.id !== 'unassigned' ? (
                    <button
                      type="button"
                      className="ghost-button trip-card-action-button"
                      onClick={() => {
                        const trip = trips.find((item) => item.id === group.id);
                        if (trip) {
                          openEditTripDialog(trip);
                        }
                      }}
                    >
                      编辑行程
                    </button>
                  ) : null}
                  {group.id !== 'unassigned' ? (
                    <button
                      type="button"
                      className="ghost-button trip-card-action-button trip-card-action-danger"
                      onClick={() => setPendingDeleteTripId(group.id)}
                    >
                      删除行程
                    </button>
                  ) : selectionMode ? (
                    <span className="trip-unassigned-hint">可多选后归入行程</span>
                  ) : null}
                </div>
              </div>
              <div className="trip-timeline-day-items">
                {group.markers.map((marker) => renderMarkerButton(marker))}
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
                  {group.markers.map((marker) => renderMarkerButton(marker))}
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
