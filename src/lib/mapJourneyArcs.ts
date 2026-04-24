import type { VisitMarker } from '../types';
import { resolveMarkerMapRegionId } from './mapRegionResolver';
import { sortMarkersAsc } from './markerSorting';

export interface JourneyArc {
  key: string;
  d: string;
  arrowD: string;
  userId: string;
  fromName: string;
  toName: string;
  dateLabel: string;
}

interface JourneyPointSource {
  region?: {
    id: string;
  };
  hasLabelPoint: boolean;
  uniqueUsers: string[];
  labelX: number;
  labelY: number;
}

export function buildJourneyArcs(input: {
  activeUserId: string;
  currentScale: number;
  markers: VisitMarker[];
  pointSources: JourneyPointSource[];
  mapScope: VisitMarker['scope'];
}) {
  const { activeUserId, currentScale, markers, pointSources, mapScope } = input;
  const pointsByRegionId = new Map<
    string,
    {
      users: string[];
      x: number;
      y: number;
    }
  >();

  pointSources.forEach((item) => {
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

  const orderedMarkers = [...activeUserMarkers].sort(sortMarkersAsc);
  const points = orderedMarkers
    .map((marker) => {
      const regionId = resolveMarkerMapRegionId(marker, mapScope);
      const regionPoint = pointsByRegionId.get(regionId) ?? pointsByRegionId.get(marker.scopeId);
      if (!regionPoint) return null;
      const userIndex = regionPoint.users.indexOf(activeUserId);
      if (userIndex === -1) return null;
      return {
        markerId: marker.id,
        regionId: pointsByRegionId.has(regionId) ? regionId : marker.scopeId,
        scopeName: marker.scopeName,
        visitedStartAt: marker.visitedStartAt,
        x: regionPoint.x + userIndex * 12 - ((regionPoint.users.length - 1) * 6),
        y: regionPoint.y,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item, index, list) => index === 0 || list[index - 1].regionId !== item.regionId);

  const arcs: JourneyArc[] = [];

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
}
