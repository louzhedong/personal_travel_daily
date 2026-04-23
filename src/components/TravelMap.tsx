import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { geoContains } from 'd3-geo';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MapToggle from './MapToggle';
import TravelIcon from './ui/TravelIcon';
import { pathFor, projectionFor } from '../geo/projection';
import { loadGeoForScope, type LoadedFeature } from '../geo/loader';
import type { RegionOption, Scope, UserProfile, VisitMarker } from '../types';

interface RenderSegment {
  key: string;
  d: string;
}

interface StaticRenderItem {
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

interface RenderItem extends StaticRenderItem {
  regionMarkers: VisitMarker[];
  uniqueUsers: string[];
  isActive: boolean;
  projectedArea: number;
}

interface JourneyArc {
  key: string;
  d: string;
  arrowD: string;
  userId: string;
  fromName: string;
  toName: string;
  dateLabel: string;
}

const MapPathLayer = memo(function MapPathLayer({
  renderItems,
}: {
  renderItems: RenderItem[];
}) {
  return (
    <>
      {renderItems.map(({ item, region, regionMarkers, isActive }) => (
        <g key={item.name} className={region ? 'region-group' : 'region-group disabled'}>
          {item.segments.map((segment) => {
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
                    : regionMarkers.length > 0
                      ? 'map-region visited'
                      : 'map-region'
                }
              />
            );
          })}
        </g>
      ))}
    </>
  );
});

const MapLabelLayer = memo(function MapLabelLayer({
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

const MapJourneyLayer = memo(function MapJourneyLayer({
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

const JourneyTooltipPortal = memo(function JourneyTooltipPortal({
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

const MapTooltipPortal = memo(function MapTooltipPortal({
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
    .sort((a, b) => b.visitedStartAt.localeCompare(a.visitedStartAt))
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

interface TravelMapProps {
  scope: Scope;
  regions: RegionOption[];
  markers: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  selectedRegionId?: string;
  onSelectRegion: (region: RegionOption) => void;
  onScopeChange: (scope: Scope) => void;
}

export function TravelMap({
  scope,
  regions,
  markers,
  users,
  activeUserId,
  selectedRegionId,
  onSelectRegion,
  onScopeChange,
}: TravelMapProps) {
  const [hoverRegionId, setHoverRegionId] = useState<string | null>(null);
  const [geoFeatures, setGeoFeatures] = useState<LoadedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showJourneyLines, setShowJourneyLines] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const [journeyTooltipPos, setJourneyTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredJourneyArc, setHoveredJourneyArc] = useState<JourneyArc | null>(null);
  const pointerInsideRef = useRef(false);
  const hoverFrameRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<{ path: SVGPathElement | null; clientX: number; clientY: number } | null>(null);
  const hoverRegionRef = useRef<string | null>(null);
  const hoverSegmentRef = useRef<string | null>(null);
  const hoverPathRef = useRef<SVGPathElement | null>(null);

  // ViewBox zoom & pan state
  const INITIAL_W = 920;
  const INITIAL_H = 520;
  const [viewBox, setViewBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: INITIAL_W,
    h: INITIAL_H,
  });
  const viewBoxRef = useRef(viewBox);
  const MIN_SCALE = 1; // cannot zoom out
  const MAX_SCALE = 10; // up to 10x
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    loadGeoForScope(scope)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setGeoFeatures(data);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : '地图数据加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => () => {
    if (hoverFrameRef.current !== null) {
      cancelAnimationFrame(hoverFrameRef.current);
    }
  }, []);

  const markersByRegion = useMemo(() => {
    const result = new Map<string, VisitMarker[]>();

    markers.forEach((marker) => {
      const list = result.get(marker.scopeId) ?? [];
      list.push(marker);
      result.set(marker.scopeId, list);
    });

    return result;
  }, [markers]);

  const userColorMap = useMemo(
    () => new Map(users.map((item) => [item.id, item.color])),
    [users],
  );

  const regionByName = useMemo(
    () => new Map(regions.map((region) => [region.name, region])),
    [regions],
  );

  const collection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: geoFeatures.map((item) => item.feature),
    }),
    [geoFeatures],
  );

  const projection = useMemo(() => {
    if (geoFeatures.length === 0) {
      return null;
    }
    return projectionFor(scope, 920, 520, collection);
  }, [collection, geoFeatures.length, scope]);

  const path = useMemo(() => (projection ? pathFor(projection) : null), [projection]);
  const segmentedFeatures = useMemo(() => {
    return geoFeatures.map((item) => {
      const geometry = item.feature.geometry as { type?: string; coordinates?: unknown } | undefined;
      if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
        const segments = geometry.coordinates.map((coords, index) => ({
          key: `${item.name}-${index}`,
          feature: {
            ...item.feature,
            geometry: {
              type: 'Polygon',
              coordinates: coords,
            },
          },
        }));
        return { ...item, segments };
      }
      return {
        ...item,
        segments: [{ key: `${item.name}-0`, feature: item.feature }],
      };
    });
  }, [geoFeatures]);

  const hoveredRegion = regions.find((item) => item.id === hoverRegionId);
  const hoveredMarkers = hoveredRegion ? markersByRegion.get(hoveredRegion.id) ?? [] : [];
  const currentScale = INITIAL_W / viewBox.w;
  const labelFontSize = Math.max(4.5, 11 / currentScale);
  const labelStrokeWidth = Math.max(0.8, 3 / currentScale);
  const markerDotRadius = Math.max(1.8, 4.5 / currentScale);
  const journeyStrokeWidth = Math.max(1.1, 2 / currentScale);
  const labelAreaThreshold = 1800;
  const staticItems = useMemo<StaticRenderItem[]>(() => {
    if (!path) {
      return [];
    }

    return segmentedFeatures.map((item) => {
      const region = regionByName.get(item.name);
      const primarySegment = item.segments.reduce((best, current) => {
        return path.area(current.feature as never) > path.area(best.feature as never) ? current : best;
      }, item.segments[0]);
      const labelPoint = getLabelPoint(primarySegment.feature);
      const hasLabelPoint = !!labelPoint;
      const labelX = labelPoint?.[0] ?? 0;
      const labelY = labelPoint?.[1] ?? 0;

      return {
        item: {
          name: item.name,
          segments: item.segments.map((segment) => ({
            key: segment.key,
            d: path(segment.feature as never) ?? '',
          })),
        },
        region,
        hasLabelPoint,
        labelX,
        labelY,
        baseArea: path.area(primarySegment.feature as never),
      };
    });
  }, [
    path,
    regionByName,
    segmentedFeatures,
  ]);

  const renderItems = useMemo<RenderItem[]>(() => {
    return staticItems.map((item) => {
      const regionMarkers = item.region ? markersByRegion.get(item.region.id) ?? [] : [];
      const uniqueUsers = Array.from(new Set(regionMarkers.map((marker) => marker.userId))).slice(0, 3);
      const isActive = item.region?.id === selectedRegionId;
      return {
        ...item,
        regionMarkers,
        uniqueUsers,
        isActive,
        projectedArea: item.baseArea * currentScale * currentScale,
      };
    });
  }, [currentScale, markersByRegion, selectedRegionId, staticItems]);

  const cssVar = (vars: Record<string, string | number>) => vars as CSSProperties;
  const largeLabelItems = useMemo(
    () =>
      renderItems.filter(
        (item) => item.region && item.hasLabelPoint && (item.projectedArea >= labelAreaThreshold || item.isActive),
      ),
    [labelAreaThreshold, renderItems],
  );
  const hoverLabelItem = useMemo(
    () =>
      renderItems.find(
        (item) =>
          item.region &&
          item.hasLabelPoint &&
          item.region.id === hoverRegionId &&
          item.projectedArea < labelAreaThreshold &&
          !item.isActive,
      ) ?? null,
    [hoverRegionId, labelAreaThreshold, renderItems],
  );

  const journeyArcs = useMemo<JourneyArc[]>(() => {
    if (!showJourneyLines) {
      return [];
    }

    const pointsByRegionId = new Map<
      string,
      {
        users: string[];
        x: number;
        y: number;
      }
    >();

    renderItems.forEach((item) => {
      if (!item.region || !item.hasLabelPoint || item.uniqueUsers.length === 0) {
        return;
      }
      pointsByRegionId.set(item.region.id, {
        users: item.uniqueUsers,
        x: item.labelX,
        y: item.labelY + 16 / currentScale,
      });
    });

    const activeUserMarkers = markers.filter((marker) => marker.userId === activeUserId);
    if (activeUserMarkers.length < 2) {
      return [];
    }

    const arcs: JourneyArc[] = [];
    const orderedMarkers = [...activeUserMarkers].sort((a, b) => {
      const startDiff = a.visitedStartAt.localeCompare(b.visitedStartAt);
      if (startDiff !== 0) return startDiff;
      const endDiff = a.visitedEndAt.localeCompare(b.visitedEndAt);
      if (endDiff !== 0) return endDiff;
      return a.createdAt.localeCompare(b.createdAt);
    });

    const points = orderedMarkers
      .map((marker) => {
        const regionPoint = pointsByRegionId.get(marker.scopeId);
        if (!regionPoint) return null;
        const userIndex = regionPoint.users.indexOf(activeUserId);
        if (userIndex === -1) return null;
        return {
          markerId: marker.id,
          regionId: marker.scopeId,
          scopeName: marker.scopeName,
          visitedStartAt: marker.visitedStartAt,
          visitedEndAt: marker.visitedEndAt,
          x: regionPoint.x + userIndex * 12 - ((regionPoint.users.length - 1) * 6),
          y: regionPoint.y,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item, index, list) => index === 0 || list[index - 1].regionId !== item.regionId);

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1) {
        continue;
      }

      const midpointX = (from.x + to.x) / 2;
      const midpointY = (from.y + to.y) / 2;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const bend = Math.min(40, distance * 0.18);
      const controlX = midpointX + normalX * bend;
      const controlY = midpointY + normalY * bend;
      const tangentX = to.x - controlX;
      const tangentY = to.y - controlY;
      const tangentDistance = Math.hypot(tangentX, tangentY);
      if (tangentDistance < 1) {
        continue;
      }
      const dirX = tangentX / tangentDistance;
      const dirY = tangentY / tangentDistance;
      const arrowLength = Math.max(4, 7 / currentScale);
      const arrowWidth = Math.max(2.1, 3.2 / currentScale);
      const baseX = to.x - dirX * arrowLength;
      const baseY = to.y - dirY * arrowLength;
      const perpX = -dirY;
      const perpY = dirX;
      const leftX = baseX + perpX * arrowWidth;
      const leftY = baseY + perpY * arrowWidth;
      const rightX = baseX - perpX * arrowWidth;
      const rightY = baseY - perpY * arrowWidth;

      arcs.push({
        key: `${activeUserId}-${from.markerId}-${to.markerId}`,
        userId: activeUserId,
        d: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
        arrowD: `M ${to.x} ${to.y} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`,
        fromName: from.scopeName,
        toName: to.scopeName,
        dateLabel: `${from.visitedStartAt} → ${to.visitedStartAt}`,
      });
    }

    return arcs;
  }, [activeUserId, currentScale, markers, renderItems, showJourneyLines]);

  const handleJourneyHover = (arc: JourneyArc, event: ReactMouseEvent<SVGPathElement>) => {
    setHoveredJourneyArc(arc);
    setJourneyTooltipPos({
      left: event.clientX + 16,
      top: event.clientY + 16,
    });
  };

  const handleJourneyLeave = () => {
    setHoveredJourneyArc(null);
    setJourneyTooltipPos(null);
  };

  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  useEffect(() => {
    hoverRegionRef.current = hoverRegionId;
  }, [hoverRegionId]);

  // Reset viewBox on scope change
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: INITIAL_W, h: INITIAL_H });
  }, [scope]);

  // Compute SVG coordinate given client pixel
  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { sx: 0, sy: 0, ok: false, bbox: { left: 0, top: 0, width: 1, height: 1 } };
    const bbox = svg.getBoundingClientRect();
    const currentViewBox = viewBoxRef.current;
    const px = (clientX - bbox.left) / bbox.width;
    const py = (clientY - bbox.top) / bbox.height;
    const sx = currentViewBox.x + px * currentViewBox.w;
    const sy = currentViewBox.y + py * currentViewBox.h;
    return { sx, sy, ok: true, bbox };
  };

  const clampViewBox = (next: { x: number; y: number; w: number; h: number }) => {
    // Do not allow panning outside huge margins (allow 50% overscroll)
    const marginX = INITIAL_W * 0.5;
    const marginY = INITIAL_H * 0.5;
    const x = Math.min(Math.max(next.x, -marginX), INITIAL_W - next.w + marginX);
    const y = Math.min(Math.max(next.y, -marginY), INITIAL_H - next.h + marginY);
    return { ...next, x, y };
  };

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    // factor > 1 zoom in, < 1 zoom out
    const { sx, sy } = clientToSvg(clientX, clientY);
    setViewBox((currentViewBox) => {
      const scale = INITIAL_W / currentViewBox.w;
      const targetScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
      const s = targetScale / scale;
      const newW = currentViewBox.w / s;
      const newH = currentViewBox.h / s;

      const dx = (sx - currentViewBox.x) / currentViewBox.w;
      const dy = (sy - currentViewBox.y) / currentViewBox.h;
      const newX = sx - dx * newW;
      const newY = sy - dy * newH;

      return clampViewBox({ x: newX, y: newY, w: newW, h: newH });
    });
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: viewBox.x,
      originY: viewBox.y,
      moved: false,
    };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    // Change cursor to grabbing
    (e.currentTarget as SVGSVGElement).style.cursor = 'grabbing';
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const svg = svgRef.current;
    if (!svg) return;
    const bbox = svg.getBoundingClientRect();
    const dxPx = e.clientX - d.startX;
    const dyPx = e.clientY - d.startY;
    if (Math.abs(dxPx) + Math.abs(dyPx) > 2) d.moved = true;
    // Convert pixel delta to viewBox delta
    const dx = (dxPx / bbox.width) * viewBox.w;
    const dy = (dyPx / bbox.height) * viewBox.h;
    const next = { x: d.originX - dx, y: d.originY - dy, w: viewBox.w, h: viewBox.h };
    setViewBox(clampViewBox(next));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (svg) svg.style.cursor = '';
    const shouldSelect = !dragRef.current.moved && hoverRegionRef.current;
    dragRef.current.active = false;
    (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
    if (shouldSelect) {
      const region = regions.find((item) => item.id === hoverRegionRef.current);
      if (region) {
        onSelectRegion(region);
      }
    }
  };

  const onResetView = () => {
    setViewBox({ x: 0, y: 0, w: INITIAL_W, h: INITIAL_H });
  };

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, event.clientX, event.clientY);
    };

    shell.addEventListener('wheel', handleWheel, { passive: false });
    return () => shell.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (dragRef.current.active) {
        return;
      }

      const target = (event.target as Element | null)?.closest?.('path[data-segment-key]') as SVGPathElement | null;
      queueHoverUpdate(target, event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      queueHoverUpdate(null, 0, 0);
    };

    svg.addEventListener('pointermove', handlePointerMove);
    svg.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      svg.removeEventListener('pointermove', handlePointerMove);
      svg.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const handleGlobalWheel = (event: WheelEvent) => {
      if (!pointerInsideRef.current) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel, { capture: true } as EventListenerOptions);
  }, []);

  function getLabelPoint(feature: LoadedFeature['feature']) {
    if (!path || !projection) {
      return null;
    }

    const centroid = path.centroid(feature as never);
    const candidates: Array<[number, number]> = [];
    const bounds = path.bounds(feature as never);
    const minX = bounds[0][0];
    const minY = bounds[0][1];
    const maxX = bounds[1][0];
    const maxY = bounds[1][1];
    const xs = [0.2, 0.35, 0.5, 0.65, 0.8];
    const ys = [0.2, 0.35, 0.5, 0.65, 0.8];

    candidates.push(centroid);

    xs.forEach((fx) => {
      ys.forEach((fy) => {
        candidates.push([minX + (maxX - minX) * fx, minY + (maxY - minY) * fy]);
      });
    });

    let best: [number, number] | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [x, y] of candidates) {
      const lonLat = projection.invert?.([x, y]);
      if (lonLat && geoContains(feature as never, lonLat as never)) {
        const distance = (x - centroid[0]) ** 2 + (y - centroid[1]) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = [x, y];
        }
      }
    }

    return best;
  }

  const updateTooltipPosition = (clientX: number, clientY: number) => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }
    const width = 280;
    const height = 110;
    const gap = 14;
    let left = clientX + gap;
    let top = clientY + gap;

    if (left + width > window.innerWidth - 12) {
      left = clientX - width - gap;
    }
    if (top + height > window.innerHeight - 12) {
      top = clientY - height - gap;
    }

    left = Math.max(12, left);
    top = Math.max(12, top);

    setTooltipPos({ left, top });
  };

  const clearTooltip = () => {
    setTooltipPos(null);
  };

  const applyHoverTarget = (pathElement: SVGPathElement | null, clientX: number, clientY: number) => {
    if (hoverPathRef.current !== pathElement) {
      hoverPathRef.current?.classList.remove('hover');
      if (pathElement) {
        pathElement.classList.add('hover');
      }
      hoverPathRef.current = pathElement;
    }

    const nextRegionId = pathElement?.getAttribute('data-region-id') || null;
    const nextSegmentKey = pathElement?.getAttribute('data-segment-key') || null;

    if (hoverRegionRef.current !== nextRegionId) {
      hoverRegionRef.current = nextRegionId;
      setHoverRegionId(nextRegionId);
    }
    hoverSegmentRef.current = nextSegmentKey;

    if (pathElement) {
      updateTooltipPosition(clientX, clientY);
    } else {
      clearTooltip();
    }
  };

  const queueHoverUpdate = (pathElement: SVGPathElement | null, clientX: number, clientY: number) => {
    pendingHoverRef.current = { path: pathElement, clientX, clientY };
    if (hoverFrameRef.current !== null) {
      return;
    }

    hoverFrameRef.current = requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      const payload = pendingHoverRef.current;
      if (!payload) {
        return;
      }
      applyHoverTarget(payload.path, payload.clientX, payload.clientY);
    });
  };

  return (
    <section className="card panel-card stack gap-16">
      <div className="section-heading">
        <div className="map-heading-main">
          <div className="map-heading-title-row">
            <span className="travel-icon-badge travel-icon-badge-blue map-heading-icon">
              <TravelIcon name={scope === 'domestic' ? 'compass' : 'globe'} size={16} />
            </span>
            <h3>{scope === 'domestic' ? '国内旅行版图' : '世界旅行版图'}</h3>
          </div>
          <p>点击地图区域即可打开标记表单，悬停可查看当前区域的标记数量。</p>
        </div>
        <div className="map-heading-side">
          <div className="map-heading-controls">
            <div className="map-segmented-header">
              <span className="map-caption">
                <span className="travel-icon-inline">
                  <TravelIcon name="route" size={14} />
                </span>
                {scope === 'domestic' ? '中国省级示意图' : '世界国家示意图'}
              </span>
              <MapToggle scope={scope} onChange={onScopeChange} />
            </div>
            <button
              type="button"
              className={showJourneyLines ? 'map-route-toggle active' : 'map-route-toggle'}
              aria-pressed={showJourneyLines}
              onClick={() => setShowJourneyLines((current) => !current)}
            >
              <span className="travel-icon-inline">
                <TravelIcon name="route" size={14} />
              </span>
              {showJourneyLines ? '隐藏旅途轨迹' : '显示旅途轨迹'}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={shellRef}
        className="map-shell"
        onMouseEnter={() => {
          pointerInsideRef.current = true;
        }}
        onMouseLeave={() => {
          pointerInsideRef.current = false;
          queueHoverUpdate(null, 0, 0);
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="travel-map"
          role="img"
          aria-label="旅游地图"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <rect x="0" y="0" width="920" height="520" rx="20" fill={scope === 'domestic' ? '#eff6ff' : '#effdf7'} />

          {!loading && !error && path ? (
            <MapPathLayer renderItems={renderItems} />
          ) : null}

          {!loading && !error && path ? (
            <MapJourneyLayer
              arcs={journeyArcs}
              userColorMap={userColorMap}
              cssVar={cssVar}
              strokeWidth={journeyStrokeWidth}
              hoveredArcKey={hoveredJourneyArc?.key ?? null}
              onHoverArc={handleJourneyHover}
              onLeaveArc={handleJourneyLeave}
            />
          ) : null}

          {!loading && !error && path ? (
            <MapLabelLayer
              largeLabelItems={largeLabelItems}
              hoverLabelItem={hoverLabelItem}
              labelFontSize={labelFontSize}
              labelStrokeWidth={labelStrokeWidth}
              currentScale={currentScale}
              markerDotRadius={markerDotRadius}
              userColorMap={userColorMap}
              cssVar={cssVar}
            />
          ) : null}
        </svg>

        <div className="map-top-right">
          <div className="map-zoom-controls">
            <button
              type="button"
              className="map-zoom-button"
              aria-label="放大"
              onClick={() => {
                const box = svgRef.current?.getBoundingClientRect();
                const cx = (box?.left ?? 0) + (box?.width ?? 0) / 2;
                const cy = (box?.top ?? 0) + (box?.height ?? 0) / 2;
                zoomAt(1.25, cx, cy);
              }}
            >
              +
            </button>
            <button
              type="button"
              className="map-zoom-button"
              aria-label="缩小"
              onClick={() => {
                const box = svgRef.current?.getBoundingClientRect();
                const cx = (box?.left ?? 0) + (box?.width ?? 0) / 2;
                const cy = (box?.top ?? 0) + (box?.height ?? 0) / 2;
                zoomAt(1 / 1.25, cx, cy);
              }}
            >
              −
            </button>
            <button type="button" className="map-zoom-button" aria-label="重置" onClick={onResetView}>
              ○
            </button>
          </div>
        </div>

        {loading ? <div className="map-status">地图数据加载中...</div> : null}
        {error ? <div className="map-status error">{error}</div> : null}
      </div>

      <MapTooltipPortal
        hoveredRegion={hoveredRegion}
        hoveredMarkers={hoveredMarkers}
        tooltipPos={tooltipPos}
        users={users}
      />
      <JourneyTooltipPortal hoveredArc={hoveredJourneyArc} tooltipPos={journeyTooltipPos} />

      <div className="map-legend">
        <div className="legend-label">用户标签</div>
        <div className="user-chip-list">
          {users.map((user) => (
            <span key={user.id} className="legend-chip">
              <span
                className="legend-dot tone-dot"
                style={cssVar({ '--tone-color': user.color })}
              />
              {user.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TravelMap;
