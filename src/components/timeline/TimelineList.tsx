import type { ReactNode } from 'react';
import type { VisitMarker } from '../../types';

/**
 * Plain timeline branch grouped by date.
 * 普通时间线分支：按日期分组渲染；与行程分组分支共享 renderMarkerButton，
 * 保证整理模式下点击记录进入选择态的行为一致。
 */

export interface TimelineDayGroup {
  date: string;
  markers: VisitMarker[];
}

export interface TimelineListProps {
  groups: TimelineDayGroup[];
  renderMarkerButton: (marker: VisitMarker) => ReactNode;
}

export default function TimelineList({ groups, renderMarkerButton }: TimelineListProps) {
  return (
    <div className="trip-timeline-list-shell">
      <div className="trip-timeline-list">
        {groups.map((group) => (
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
  );
}
