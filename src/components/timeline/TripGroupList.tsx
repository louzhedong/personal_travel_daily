import type { ReactNode } from 'react';
import type { TripCollection, VisitMarker } from '../../types';

/**
 * Trip-grouped timeline branch. Shares `renderMarkerButton` with plain timeline
 * so that selection-mode behavior stays consistent across branches.
 * 行程分组分支：按行程聚合渲染；marker 按钮通过 renderMarkerButton prop 与
 * 普通时间线分支共享，保证整理模式选择态一致。
 */

export interface TripTimelineGroup {
  id: string;
  title: string;
  range: string;
  markers: VisitMarker[];
  startsAt: string;
  coverImageUrl?: string;
}

export interface TripGroupListProps {
  groups: TripTimelineGroup[];
  trips: TripCollection[];
  selectionMode: boolean;
  onOpenTripDetail?: (tripId: string) => void;
  onEditTrip: (trip: TripCollection) => void;
  onRequestDeleteTrip: (tripId: string) => void;
  renderMarkerButton: (marker: VisitMarker) => ReactNode;
}

export default function TripGroupList({
  groups,
  trips,
  selectionMode,
  onOpenTripDetail,
  onEditTrip,
  onRequestDeleteTrip,
  renderMarkerButton,
}: TripGroupListProps) {
  return (
    <div className="trip-collection-list">
      {groups.map((group) => (
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
                <button
                  type="button"
                  className="ghost-button trip-card-action-button"
                  onClick={() => onOpenTripDetail(group.id)}
                >
                  查看详情
                </button>
              ) : null}
              {group.id !== 'unassigned' ? (
                <button
                  type="button"
                  className="ghost-button trip-card-action-button"
                  onClick={() => {
                    // 通过 trips 源数据找到目标行程 / look up the backing trip
                    const trip = trips.find((item) => item.id === group.id);
                    if (trip) {
                      onEditTrip(trip);
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
                  onClick={() => onRequestDeleteTrip(group.id)}
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
  );
}
