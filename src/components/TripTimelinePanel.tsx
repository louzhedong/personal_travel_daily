import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from './ui/ConfirmDialog';
import DateField from './ui/DateField';
import Dialog from './ui/Dialog';
import FancySelect from './ui/FancySelect';
import TravelIcon from './ui/TravelIcon';
import TimelineList, { type TimelineDayGroup } from './timeline/TimelineList';
import TripBatchToolbar from './timeline/TripBatchToolbar';
import TripGroupList, { type TripTimelineGroup } from './timeline/TripGroupList';
import { formatDateRange, formatVisitedRange, getDateOnlyYear } from '../lib/date';
import { sortMarkersDesc } from '../lib/markerSorting';
import { useTripTimelineActions } from '../modules/app/useTripTimelineActions';
import type { Scope, TripCollection, VisitMarker } from '../types';

/**
 * Container component orchestrating the trip timeline panel.
 * 行程时间线面板容器：负责筛选、分组计算与子组件编排，
 * 将对话框/批量整理等 UI 状态交由 useTripTimelineActions 管理，
 * 将分支渲染交由 TimelineList / TripGroupList / TripBatchToolbar 承担。
 */

type TimelineScopeFilter = Scope | 'all';
type TimelineYearFilter = 'all' | string;

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
  // 筛选相关的 UI state 保留在容器中 / scope & year filters stay in container
  const [scopeFilter, setScopeFilter] = useState<TimelineScopeFilter>('all');
  const [yearFilter, setYearFilter] = useState<TimelineYearFilter>('all');

  // 对话框、表单、整理模式交给 hook / dialog/form/selection managed by hook
  const actions = useTripTimelineActions();
  const {
    tripDialogMode,
    editingTripId,
    tripName,
    tripStartsAt,
    tripEndsAt,
    tripNote,
    setTripName,
    setTripStartsAt,
    setTripEndsAt,
    setTripNote,
    canSubmitTrip,
    openCreateTripDialog,
    openEditTripDialog,
    closeTripDialog,
    pendingDeleteTripId,
    setPendingDeleteTripId,
    selectionMode,
    selectedMarkerIds,
    setSelectedMarkerIds,
    enterSelectionMode,
    exitSelectionMode,
    toggleMarkerSelection,
    batchTripTarget,
    setBatchTripTarget,
  } = actions;

  const pendingDeleteTrip = pendingDeleteTripId
    ? trips.find((trip) => trip.id === pendingDeleteTripId)
    : undefined;

  // 提交行程表单 / submit trip form
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

  // 当前用户的记录（倒序） / current user markers sorted desc
  const currentUserMarkers = useMemo(
    () => markers.filter((item) => item.userId === activeUserId).sort(sortMarkersDesc),
    [activeUserId, markers],
  );

  // 可选的年份列表 / available year options
  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(currentUserMarkers.map((item) => getDateOnlyYear(item.visitedStartAt))),
    ).sort((left, right) => right.localeCompare(left));
  }, [currentUserMarkers]);

  // 根据筛选条件过滤 / apply scope/year filters
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

  // 可见集合变化时同步已选集合 / sync selection with visible markers
  useEffect(() => {
    const visibleMarkerIds = new Set(filteredMarkers.map((marker) => marker.id));
    setSelectedMarkerIds((current) => {
      const next = current.filter((markerId) => visibleMarkerIds.has(markerId));
      if (next.length === current.length && next.every((markerId, index) => markerId === current[index])) {
        return current;
      }
      return next;
    });
  }, [filteredMarkers, setSelectedMarkerIds]);

  // 普通时间线分组（按日期） / plain timeline groups by date
  const timelineGroups = useMemo<TimelineDayGroup[]>(() => {
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

  // 按行程分组 / trip-based groups
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

  // 已选标记对象 / selected marker objects (for tooltip)
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

  // 应用批量归属 / apply batch trip assignment
  const handleApplyBatchTrip = () => {
    if (!batchTripTarget || selectedMarkerIds.length === 0) {
      return;
    }

    onBulkAssignMarkersToTrip(
      selectedMarkerIds,
      batchTripTarget === 'unassigned' ? null : batchTripTarget,
    );
    exitSelectionMode();
  };

  // marker 按钮渲染：在选择态和查看态之间切换，由两个分支共享
  // render marker button shared between branches, toggling selection vs detail
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
            className={
              selectionMode ? 'ghost-button trip-create-entry is-active' : 'ghost-button trip-create-entry'
            }
            onClick={() => {
              if (selectionMode) {
                exitSelectionMode();
                return;
              }
              enterSelectionMode();
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
          <TripBatchToolbar
            selectedMarkerIds={selectedMarkerIds}
            selectedMarkers={selectedMarkers}
            batchTripTarget={batchTripTarget}
            onBatchTripTargetChange={setBatchTripTarget}
            tripOptions={tripOptions}
            onApplyBatch={handleApplyBatchTrip}
          />
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
        <TripGroupList
          groups={tripGroups}
          trips={trips}
          selectionMode={selectionMode}
          onOpenTripDetail={onOpenTripDetail}
          onEditTrip={openEditTripDialog}
          onRequestDeleteTrip={setPendingDeleteTripId}
          renderMarkerButton={renderMarkerButton}
        />
      ) : timelineGroups.length > 0 ? (
        <TimelineList groups={timelineGroups} renderMarkerButton={renderMarkerButton} />
      ) : (
        <div className="saved-guides-empty">当前筛选条件下暂无记录。</div>
      )}
    </section>
  );
}
