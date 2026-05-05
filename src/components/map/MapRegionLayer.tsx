// 地图静态区域图层 / Static map region layers.
// 提供 path 与 label 的纯渲染组件，数据由 TravelMap 预先计算好再传入。
// Pure-render components for paths and labels; data is pre-computed by TravelMap.

import type { CSSProperties } from 'react';
import { memo } from 'react';
import type { RegionOption, VisitMarker, WishlistItem } from '../../types';

// 单一区域的一段路径 / Single polygon segment belonging to a region.
export interface RenderSegment {
  key: string;
  d: string;
}

// 静态几何与标签信息 / Static geometry + label metadata for one region feature.
export interface StaticRenderItem {
  item: {
    name: string;
    segments: RenderSegment[];
  };
  region: RegionOption | undefined;
  labelX: number;
  labelY: number;
  hasLabelPoint: boolean;
  baseArea: number;
}

// 静态信息 + 运行时计算结果 / Static data plus runtime flags for a render cycle.
export interface RenderItem extends StaticRenderItem {
  regionMarkers: VisitMarker[];
  regionWishlistItems: WishlistItem[];
  uniqueUsers: string[];
  isActive: boolean;
  projectedArea: number;
  regionStyle: CSSProperties;
}

/**
 * 区域 path 图层 / Region path layer.
 * 输出每个区域的 path 节点与 hover 所需的 data-* 属性。
 * Emits each region's path with data-* attributes required for hover handling.
 */
export const MapPathLayer = memo(function MapPathLayer({
  renderItems,
}: {
  renderItems: RenderItem[];
}) {
  return (
    <>
      {renderItems.map(({ item, region, regionMarkers, regionWishlistItems, isActive, regionStyle }) => (
        <g key={item.name} className={region ? 'region-group' : 'region-group disabled'}>
          {item.segments.map((segment) => {
            const hasMapSignal = regionMarkers.length > 0 || regionWishlistItems.length > 0;
            return (
              <path
                key={segment.key}
                data-testid={`segment-${segment.key}`}
                data-region-id={region?.id ?? ''}
                data-segment-key={segment.key}
                d={segment.d}
                className={
                  isActive
                    ? 'map-region active'
                    : hasMapSignal
                      ? 'map-region visited'
                      : 'map-region'
                }
                style={hasMapSignal && !isActive ? regionStyle : undefined}
              />
            );
          })}
        </g>
      ))}
    </>
  );
});

/**
 * 区域文字标签图层 / Region label layer.
 * 展示常驻大区域标签 + 当前 hover 的小区域标签。
 * Shows always-on labels for large regions and an on-hover label for small ones.
 */
export const MapLabelLayer = memo(function MapLabelLayer({
  largeLabelItems,
  hoverLabelItem,
  labelFontSize,
  labelStrokeWidth,
  currentScale,
  markerDotRadius,
  userColorMap,
  cssVar,
}: {
  largeLabelItems: RenderItem[];
  hoverLabelItem: RenderItem | null;
  labelFontSize: number;
  labelStrokeWidth: number;
  currentScale: number;
  markerDotRadius: number;
  userColorMap: Map<string, string>;
  cssVar: (vars: Record<string, string | number>) => CSSProperties;
}) {
  return (
    <g className="map-label-layer">
      {largeLabelItems.map(({ item, region, uniqueUsers, labelX, labelY }) => {
        if (!region) return null;
        return (
          <g key={`${item.name}-label`}>
            <text
              x={labelX}
              y={labelY}
              className="region-name real-map-label"
              style={cssVar({
                '--label-font-size': `${labelFontSize}px`,
                '--label-stroke-width': labelStrokeWidth,
              })}
            >
              {region.name}
            </text>
            {uniqueUsers.map((userId, index) => (
              <circle
                key={`${region.id}-${userId}`}
                cx={labelX + index * 12 - ((uniqueUsers.length - 1) * 6)}
                cy={labelY + 16 / currentScale}
                r={markerDotRadius}
                className="region-dot map-user-dot"
                style={cssVar({ '--tone-color': userColorMap.get(userId) ?? '#94a3b8' })}
              />
            ))}
          </g>
        );
      })}
      {hoverLabelItem && hoverLabelItem.region ? (
        <g key={`${hoverLabelItem.item.name}-hover-label`}>
          <text
            x={hoverLabelItem.labelX}
            y={hoverLabelItem.labelY}
            className="region-name real-map-label"
            data-testid="hover-label"
            style={cssVar({
              '--label-font-size': `${labelFontSize}px`,
              '--label-stroke-width': labelStrokeWidth,
            })}
          >
            {hoverLabelItem.region.name}
          </text>
          {hoverLabelItem.uniqueUsers.map((userId, index) => (
            <circle
              key={`${hoverLabelItem.region!.id}-${userId}`}
              cx={hoverLabelItem.labelX + index * 12 - ((hoverLabelItem.uniqueUsers.length - 1) * 6)}
              cy={hoverLabelItem.labelY + 16 / currentScale}
              r={markerDotRadius}
              className="region-dot map-user-dot"
              style={cssVar({ '--tone-color': userColorMap.get(userId) ?? '#94a3b8' })}
            />
          ))}
        </g>
      ) : null}
    </g>
  );
});
