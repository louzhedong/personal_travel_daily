// 旅程弧线与对应 tooltip / Journey arc layer and its tooltip portal.
// 把 active user 的旅途轨迹抽取到独立图层，便于 TravelMap 聚焦于编排。
// Extracts the active-user trail arcs into their own layer so TravelMap stays focused on orchestration.

import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyArc } from '../../lib/mapJourneyArcs';

/**
 * 旅程弧线 SVG 图层 / Journey arc SVG layer.
 * 负责渲染每条弧线以及箭头，并把鼠标事件上抛。
 * Renders each arc plus its arrow head and bubbles hover events upward.
 */
export const MapJourneyLayer = memo(function MapJourneyLayer({
  arcs,
  userColorMap,
  cssVar,
  strokeWidth,
  hoveredArcKey,
  onHoverArc,
  onLeaveArc,
}: {
  arcs: JourneyArc[];
  userColorMap: Map<string, string>;
  cssVar: (vars: Record<string, string | number>) => CSSProperties;
  strokeWidth: number;
  hoveredArcKey: string | null;
  onHoverArc: (arc: JourneyArc, event: ReactMouseEvent<SVGPathElement>) => void;
  onLeaveArc: () => void;
}) {
  if (arcs.length === 0) {
    return null;
  }

  return (
    <g className="map-journey-layer" aria-hidden="true">
      {arcs.map((arc) => (
        <g
          key={arc.key}
          className={hoveredArcKey === arc.key ? 'map-journey-item hovered' : 'map-journey-item'}
          style={cssVar({
            '--tone-color': userColorMap.get(arc.userId) ?? '#94a3b8',
            '--journey-stroke-width': strokeWidth,
          })}
        >
          <path
            d={arc.d}
            className="map-journey-arc"
            onMouseEnter={(event) => onHoverArc(arc, event)}
            onMouseMove={(event) => onHoverArc(arc, event)}
            onMouseLeave={onLeaveArc}
          />
          <path
            d={arc.arrowD}
            className="map-journey-arrow"
          />
        </g>
      ))}
    </g>
  );
});

/**
 * 旅程弧 tooltip portal / Tooltip portal displayed while hovering a journey arc.
 * 通过 createPortal 挂到 body，避免地图容器的裁剪。
 * Portalled to body so the tooltip is never clipped by the map container.
 */
export const JourneyTooltipPortal = memo(function JourneyTooltipPortal({
  hoveredArc,
  tooltipPos,
}: {
  hoveredArc: JourneyArc | null;
  tooltipPos: { left: number; top: number } | null;
}) {
  if (!hoveredArc || !tooltipPos) {
    return null;
  }

  return createPortal(
    <div
      className="hover-card map-hover-overlay map-journey-tooltip"
      style={{
        left: `${tooltipPos.left}px`,
        top: `${tooltipPos.top}px`,
      }}
    >
      <strong>{hoveredArc.fromName} → {hoveredArc.toName}</strong>
      <span>{hoveredArc.dateLabel}</span>
    </div>,
    document.body,
  );
});
