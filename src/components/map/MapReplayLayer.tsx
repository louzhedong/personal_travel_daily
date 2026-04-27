// 地图回放图层 / Map replay SVG layer.
// 承载回放过渡弧线与当前回放 tag 的 SVG 节点。
// Renders the replay transition arc and the active replay tag inside the SVG canvas.

import type { CSSProperties } from 'react';
import { memo } from 'react';
import type { MapReplayItem } from '../../lib/mapReplay';

// 回放 tag 的几何信息（位置、控制点、路径）。
// Geometric description of the replay tag (position, control point and path string).
export interface ReplayTagVisual {
  key: string;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  controlX: number;
  controlY: number;
  pathD: string;
}

/**
 * 构造回放 tag 的弯曲弧线 / Build the curved bezier path used by the replay tag transition.
 * 距离过小时退化为定点，避免出现抖动。
 * Collapses to a single point when the distance is negligible to avoid jitter.
 */
export function buildReplayMotionPath(input: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}) {
  const { fromX, fromY, toX, toY } = input;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    return {
      fromX: toX,
      fromY: toY,
      controlX: toX,
      controlY: toY,
      pathD: `M ${toX} ${toY}`,
    };
  }

  const midpointX = (fromX + toX) / 2;
  const midpointY = (fromY + toY) / 2;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const bend = Math.min(40, distance * 0.18);
  const controlX = midpointX + normalX * bend;
  const controlY = midpointY + normalY * bend;

  return {
    fromX,
    fromY,
    controlX,
    controlY,
    pathD: `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`,
  };
}

/**
 * 沿二次贝塞尔曲线取点 / Sample a point along the quadratic bezier curve.
 * 动画缓动时按 t (0 ~ 1) 得到 tag 的当前位置。
 * Used by the tag animation easing to read the current position at ratio t (0 ~ 1).
 */
export function getQuadraticPoint(input: {
  fromX: number;
  fromY: number;
  controlX: number;
  controlY: number;
  toX: number;
  toY: number;
  t: number;
}) {
  const { fromX, fromY, controlX, controlY, toX, toY, t } = input;
  const inverse = 1 - t;
  return {
    x: inverse * inverse * fromX + 2 * inverse * t * controlX + t * t * toX,
    y: inverse * inverse * fromY + 2 * inverse * t * controlY + t * t * toY,
  };
}

/**
 * 回放过渡弧线 / Replay transition arc layer.
 * 当手动切换上下一条记录时，展示一次性的过渡弧。
 * Shown as a transient arc when stepping prev/next manually.
 */
export const ReplayTransitionLayer = memo(function ReplayTransitionLayer({
  pathD,
}: {
  pathD: string | null;
}) {
  if (!pathD) {
    return null;
  }

  return (
    <g className="map-replay-transition-layer" aria-hidden="true">
      <path d={pathD} className="map-replay-transition-arc" data-testid="map-replay-transition-arc" />
    </g>
  );
});

/**
 * 回放 tag 层 / Replay tag layer.
 * 使用紧凑标题与圆点表示当前回放中的记录位置。
 * Shows a compact title and dot marking the currently active replay record.
 */
export const ReplayTagLayer = memo(function ReplayTagLayer({
  visual,
  item,
  currentScale,
  position,
}: {
  visual: ReplayTagVisual | null;
  item: MapReplayItem | null;
  currentScale: number;
  position: { x: number; y: number } | null;
}) {
  if (!visual || !item || !position) {
    return null;
  }

  const compactLabel = (item.marker.city || item.marker.scopeName).slice(0, 6);
  const textOffsetX = Math.max(10, 13 / currentScale);
  const textOffsetY = Math.max(10, 14 / currentScale);
  const tagFontSize = Math.max(6.5, 10 / currentScale);
  const tagStrokeWidth = Math.max(0.7, 2 / currentScale);

  return (
    <g className="map-replay-tag-layer" aria-hidden="true" data-testid="map-replay-tag">
      <g transform={`translate(${position.x}, ${position.y})`}>
        <text
          x={textOffsetX}
          y={-textOffsetY}
          className="map-replay-tag-title"
          style={{
            '--replay-tag-font-size': `${tagFontSize}px`,
            '--replay-tag-stroke-width': tagStrokeWidth,
          } as CSSProperties}
        >
          {compactLabel}
        </text>
        <circle cx="0" cy="0" r={Math.max(5, 6.5 / currentScale)} className="map-replay-tag-dot" />
      </g>
    </g>
  );
});
