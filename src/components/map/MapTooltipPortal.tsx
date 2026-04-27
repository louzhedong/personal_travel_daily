// 地图区域 tooltip / Region hover tooltip portal.
// 悬停某个区域时，以 portal 形式展示该区域概要与最近记录。
// Displays a summary and recent records for the hovered region via a portal.

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { sortMarkersDesc } from '../../lib/markerSorting';
import type { RegionOption, UserProfile, VisitMarker } from '../../types';

/**
 * 区域悬停 tooltip / Region hover tooltip component.
 * 通过 portal 挂到 body，并在空间不足时切换到鼠标另一侧。
 * Portalled to body and flips to the opposite side of the pointer when space is tight.
 */
export const MapTooltipPortal = memo(function MapTooltipPortal({
  hoveredRegion,
  hoveredMarkers,
  tooltipPos,
  users,
}: {
  hoveredRegion: RegionOption | undefined;
  hoveredMarkers: VisitMarker[];
  tooltipPos: { left: number; top: number } | null;
  users: UserProfile[];
}) {
  if (!hoveredRegion || !tooltipPos) {
    return null;
  }

  const userNameMap = new Map(users.map((user) => [user.id, user.name]));
  const previewMarkers = [...hoveredMarkers]
    .sort(sortMarkersDesc)
    .slice(0, 2);

  return createPortal(
    <div
      className="hover-card map-hover-overlay"
      style={{
        left: `${tooltipPos.left}px`,
        top: `${tooltipPos.top}px`,
      }}
    >
      <strong>{hoveredRegion.name}</strong>
      <span>{hoveredMarkers.length} 条旅行记录</span>
      {previewMarkers.length > 0 ? (
        <div className="map-hover-list">
          {previewMarkers.map((marker) => (
            <div key={marker.id} className="map-hover-item">
              <span className="map-hover-item-title">
                {userNameMap.get(marker.userId) ?? '未知用户'}
                {marker.city ? ` · ${marker.city}` : ''}
              </span>
              <span className="map-hover-item-time">
                {marker.visitedStartAt}
                {marker.visitedEndAt !== marker.visitedStartAt ? ` → ${marker.visitedEndAt}` : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="map-hover-empty">暂无旅行记录</span>
      )}
    </div>,
    document.body,
  );
});
