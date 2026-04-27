// TravelMap 主容器 / Main TravelMap container.
// 仅保留状态/effect 编排；渲染与部分交互委托给 map/ 下的子组件与 hook。
// Only keeps state/effect orchestration; rendering and complex interactions live in map/ children and hooks.

import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { geoContains } from 'd3-geo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { pathFor, projectionFor } from '../geo/projection';
import { loadGeoForScope, type LoadedFeature } from '../geo/loader';
import { buildJourneyArcs, type JourneyArc } from '../lib/mapJourneyArcs';
import { buildMapReplayItems, getMapReplayStatusText } from '../lib/mapReplay';
import { resolveMarkerMapRegionId } from '../lib/mapRegionResolver';
import type { RegionOption, Scope, UserProfile, VisitMarker } from '../types';
import { buildRegionStyle } from './map/regionStyles';
import ReplayControlBar from './map/ReplayControlBar';
import {
  MapPathLayer,
  MapLabelLayer,
  type RenderItem,
  type StaticRenderItem,
} from './map/MapRegionLayer';
import {
  ReplayTagLayer,
  ReplayTransitionLayer,
} from './map/MapReplayLayer';
import { MapJourneyLayer, JourneyTooltipPortal } from './map/MapJourneyLayer';
import { MapTooltipPortal } from './map/MapTooltipPortal';
import {
  MapHeading,
  MapSelectionAndZoom,
  MapHeatLegend,
  UserChipLegend,
} from './map/MapChrome';
import { useMapViewBox } from './map/useMapViewBox';
import { useMapHover } from './map/useMapHover';
import { useMapReplayController } from './map/useMapReplayController';

interface TravelMapProps {
  scope: Scope;
  regions: RegionOption[];
  markers: VisitMarker[];
  allMarkers?: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  selectedRegionId?: string;
  selectedRegionName?: string;
  onSelectRegion: (region: RegionOption) => void;
  onOpenSelectedRegionComposer: () => void;
  onClearSelectedRegion: () => void;
  onScopeChange: (scope: Scope) => void;
}

export function TravelMap({
  scope,
  regions,
  markers,
  allMarkers,
  users,
  activeUserId,
  selectedRegionId,
  selectedRegionName,
  onSelectRegion,
  onOpenSelectedRegionComposer,
  onClearSelectedRegion,
  onScopeChange,
}: TravelMapProps) {
  // 基础状态 / Basic state.
  const [geoFeatures, setGeoFeatures] = useState<LoadedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showJourneyLines, setShowJourneyLines] = useState(false);
  const [journeyTooltipPos, setJourneyTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredJourneyArc, setHoveredJourneyArc] = useState<JourneyArc | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const pointerInsideRef = useRef(false);

  // viewBox 与悬停相关的 hook / viewBox + hover hooks keep container lean.
  const viewBoxCtrl = useMapViewBox({
    scope,
    svgRef,
    shellRef,
    pointerInsideRef,
    onClickSelect: () => {
      const nextId = hoverRegionRefForClick.current;
      if (!nextId) return;
      const region = regions.find((item) => item.id === nextId);
      if (region) onSelectRegion(region);
    },
  });
  const { viewBox, currentScale, dragActiveRef, onPointerDown, onPointerMove, onPointerUp, zoomAt, resetView } =
    viewBoxCtrl;

  const hoverCtrl = useMapHover({ svgRef, shellRef, dragActiveRef });
  const { hoverRegionId, hoverRegionRef, tooltipPos, queueHoverUpdate } = hoverCtrl;
  const hoverRegionRefForClick = hoverRegionRef;

  // 加载 geo 数据 / Load geo data when scope changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    loadGeoForScope(scope)
      .then((data) => {
        if (!cancelled) setGeoFeatures(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '地图数据加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  // 按区域聚合 marker / Group markers by region.
  const markersByRegion = useMemo(() => {
    const result = new Map<string, VisitMarker[]>();
    const sourceMarkers = scope === 'international' && allMarkers ? allMarkers : markers;
    const regionIdByName = new Map(regions.map((region) => [region.name, region.id]));

    sourceMarkers.forEach((marker) => {
      if (scope === 'domestic' && marker.scope !== 'domestic') return;
      if (scope === 'international' && marker.scope !== 'international' && marker.scope !== 'domestic') return;
      const resolvedRegionId = resolveMarkerMapRegionId(marker, scope);
      const regionId = regionIdByName.get(resolvedRegionId) ?? resolvedRegionId;
      const list = result.get(regionId) ?? [];
      list.push(marker);
      result.set(regionId, list);
    });
    return result;
  }, [allMarkers, markers, regions, scope]);

  const mapReplaySourceMarkers = useMemo(
    () => (scope === 'international' && allMarkers ? allMarkers : markers),
    [allMarkers, markers, scope],
  );

  const replayItems = useMemo(
    () =>
      buildMapReplayItems({
        activeUserId,
        mapScope: scope,
        markers: mapReplaySourceMarkers,
        regions,
        selectedRegionId,
      }),
    [activeUserId, mapReplaySourceMarkers, regions, scope, selectedRegionId],
  );

  const userColorMap = useMemo(() => new Map(users.map((item) => [item.id, item.color])), [users]);
  const regionByName = useMemo(() => new Map(regions.map((region) => [region.name, region])), [regions]);
  const collection = useMemo(
    () => ({ type: 'FeatureCollection' as const, features: geoFeatures.map((item) => item.feature) }),
    [geoFeatures],
  );
  const projection = useMemo(() => {
    if (geoFeatures.length === 0) return null;
    return projectionFor(scope, 920, 520, collection);
  }, [collection, geoFeatures.length, scope]);
  const path = useMemo(() => (projection ? pathFor(projection) : null), [projection]);

  const segmentedFeatures = useMemo(() => {
    return geoFeatures.map((item) => {
      const geometry = item.feature.geometry as { type?: string; coordinates?: unknown } | undefined;
      if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
        const segments = geometry.coordinates.map((coords, index) => ({
          key: `${item.name}-${index}`,
          feature: { ...item.feature, geometry: { type: 'Polygon', coordinates: coords } },
        }));
        return { ...item, segments };
      }
      return { ...item, segments: [{ key: `${item.name}-0`, feature: item.feature }] };
    });
  }, [geoFeatures]);

  const hoveredRegion = regions.find((item) => item.id === hoverRegionId);
  const hoveredMarkers = hoveredRegion ? markersByRegion.get(hoveredRegion.id) ?? [] : [];
  const labelFontSize = Math.max(4.5, 11 / currentScale);
  const labelStrokeWidth = Math.max(0.8, 3 / currentScale);
  const markerDotRadius = Math.max(1.8, 4.5 / currentScale);
  const journeyStrokeWidth = Math.max(1.1, 2 / currentScale);
  const labelAreaThreshold = 1800;

  // 在区域内寻找合适的标签落点 / Find a label anchor that stays inside the region polygon.
  function getLabelPoint(feature: LoadedFeature['feature']) {
    if (!path || !projection) return null;
    const centroid = path.centroid(feature as never);
    const bounds = path.bounds(feature as never);
    const [minX, minY] = bounds[0];
    const [maxX, maxY] = bounds[1];
    const xs = [0.2, 0.35, 0.5, 0.65, 0.8];
    const ys = [0.2, 0.35, 0.5, 0.65, 0.8];
    const candidates: Array<[number, number]> = [centroid];
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

  const staticItems = useMemo<StaticRenderItem[]>(() => {
    if (!path) return [];
    return segmentedFeatures.map((item) => {
      const region = regionByName.get(item.name);
      const primarySegment = item.segments.reduce(
        (best, current) => (path.area(current.feature as never) > path.area(best.feature as never) ? current : best),
        item.segments[0],
      );
      const labelPoint = getLabelPoint(primarySegment.feature);
      return {
        item: {
          name: item.name,
          segments: item.segments.map((segment) => ({
            key: segment.key,
            d: path(segment.feature as never) ?? '',
          })),
        },
        region,
        hasLabelPoint: !!labelPoint,
        labelX: labelPoint?.[0] ?? 0,
        labelY: labelPoint?.[1] ?? 0,
        baseArea: path.area(primarySegment.feature as never),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, regionByName, segmentedFeatures]);

  const replayPointsByRegionId = useMemo(() => {
    const points = new Map<string, { x: number; y: number }>();
    staticItems.forEach((item) => {
      if (!item.region || !item.hasLabelPoint) return;
      points.set(item.region.id, { x: item.labelX, y: item.labelY + 16 / currentScale });
    });
    return points;
  }, [currentScale, staticItems]);

  // 回放控制器 / Replay controller hook.
  const replayCtrl = useMapReplayController({
    activeUserId,
    scope,
    replayItems,
    replayPointsByRegionId,
    onReplayStart: () => setShowJourneyLines(true),
  });
  const {
    replayIndex,
    replayPlaying,
    replayStarted,
    replaySpeedMs,
    setReplaySpeedMs,
    replayTagPosition,
    replayManualTransitionVisible,
    canReplay,
    activeReplayItem,
    replayTagVisual,
    handleReplayPlayPause,
    handleReplayPrevious,
    handleReplayNext,
    handleReplayEnd,
  } = replayCtrl;

  const replayStatusText = getMapReplayStatusText({
    total: replayItems.length,
    activeItem: activeReplayItem ?? undefined,
    currentIndex: replayIndex,
  });

  const renderItems = useMemo<RenderItem[]>(() => {
    const maxMarkerCount = Math.max(
      ...staticItems.map((item) => (item.region ? markersByRegion.get(item.region.id)?.length ?? 0 : 0)),
      0,
    );
    return staticItems.map((item) => {
      const regionMarkers = item.region ? markersByRegion.get(item.region.id) ?? [] : [];
      const uniqueUsers = Array.from(new Set(regionMarkers.map((marker) => marker.userId))).slice(0, 3);
      const isReplayActive = !!activeReplayItem && item.region?.id === activeReplayItem.regionId;
      const isActive = !!item.region && (item.region.id === selectedRegionId || isReplayActive);
      return {
        ...item,
        regionMarkers,
        uniqueUsers,
        isActive,
        projectedArea: item.baseArea * currentScale * currentScale,
        regionStyle: item.region
          ? buildRegionStyle(scope, item.region.id, regionMarkers.length, maxMarkerCount)
          : {},
      };
    });
  }, [activeReplayItem, currentScale, markersByRegion, scope, selectedRegionId, staticItems]);

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
    if (!showJourneyLines) return [];
    return buildJourneyArcs({
      activeUserId,
      currentScale,
      markers: mapReplaySourceMarkers,
      pointSources: renderItems,
      mapScope: scope,
    });
  }, [activeUserId, currentScale, mapReplaySourceMarkers, renderItems, scope, showJourneyLines]);

  const handleJourneyHover = (arc: JourneyArc, event: ReactMouseEvent<SVGPathElement>) => {
    setHoveredJourneyArc(arc);
    setJourneyTooltipPos({ left: event.clientX + 16, top: event.clientY + 16 });
  };
  const handleJourneyLeave = () => {
    setHoveredJourneyArc(null);
    setJourneyTooltipPos(null);
  };

  // 以 SVG 中心为锚点做缩放 / Zoom anchored to the SVG center.
  const zoomFromCenter = (factor: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    const cx = (box?.left ?? 0) + (box?.width ?? 0) / 2;
    const cy = (box?.top ?? 0) + (box?.height ?? 0) / 2;
    zoomAt(factor, cx, cy);
  };

  const canRenderLayers = !loading && !error && !!path;

  return (
    <section className="card panel-card stack gap-16">
      <MapHeading
        scope={scope}
        showJourneyLines={showJourneyLines}
        onScopeChange={onScopeChange}
        onToggleJourneyLines={() => setShowJourneyLines((current) => !current)}
      />

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

          {canRenderLayers ? <MapPathLayer renderItems={renderItems} /> : null}
          {canRenderLayers ? (
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
          {canRenderLayers ? (
            <ReplayTransitionLayer
              pathD={replayManualTransitionVisible && replayTagVisual ? replayTagVisual.pathD : null}
            />
          ) : null}
          {canRenderLayers ? (
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
          {canRenderLayers ? (
            <ReplayTagLayer
              visual={replayTagVisual}
              item={activeReplayItem}
              currentScale={currentScale}
              position={replayTagPosition}
            />
          ) : null}
        </svg>

        <MapSelectionAndZoom
          selectedRegionId={selectedRegionId}
          selectedRegionName={selectedRegionName}
          onOpenSelectedRegionComposer={onOpenSelectedRegionComposer}
          onClearSelectedRegion={onClearSelectedRegion}
          onZoomIn={() => zoomFromCenter(1.25)}
          onZoomOut={() => zoomFromCenter(1 / 1.25)}
          onResetView={resetView}
        />

        <ReplayControlBar
          statusText={replayStatusText}
          canReplay={canReplay}
          replayPlaying={replayPlaying}
          replayStarted={replayStarted}
          replayIndex={replayIndex}
          replayTotal={replayItems.length}
          replaySpeedMs={replaySpeedMs}
          onPlayPause={handleReplayPlayPause}
          onPrevious={handleReplayPrevious}
          onNext={handleReplayNext}
          onEnd={handleReplayEnd}
          onSpeedChange={setReplaySpeedMs}
        />

        <MapHeatLegend scope={scope} />

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

      <UserChipLegend users={users} cssVar={cssVar} />
    </section>
  );
}

export default TravelMap;
