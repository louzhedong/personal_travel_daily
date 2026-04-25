import { formatVisitedRange } from './date';
import { resolveMarkerMapRegionId } from './mapRegionResolver';
import { sortMarkersAsc } from './markerSorting';
import type { RegionOption, Scope, VisitMarker } from '../types';

export interface MapReplayItem {
  marker: VisitMarker;
  regionId: string;
  dateLabel: string;
  displayLabel: string;
}

export function buildMapReplayItems(input: {
  markers: VisitMarker[];
  activeUserId: string;
  mapScope: Scope;
  selectedRegionId?: string;
  regions?: RegionOption[];
}) {
  const { markers, activeUserId, mapScope, selectedRegionId, regions = [] } = input;
  const shouldFilterBySelectedRegion = mapScope === 'domestic' && !!selectedRegionId;
  const regionIdByName = new Map(regions.map((region) => [region.name, region.id]));

  return markers
    .filter((marker) => marker.userId === activeUserId)
    .filter((marker) => {
      if (mapScope === 'domestic') {
        return marker.scope === 'domestic';
      }
      return marker.scope === 'domestic' || marker.scope === 'international';
    })
    .map((marker) => {
      const resolvedRegionId = resolveMarkerMapRegionId(marker, mapScope);
      return {
        marker,
        regionId: regionIdByName.get(resolvedRegionId) ?? resolvedRegionId,
        dateLabel: formatVisitedRange(marker),
        displayLabel: `${marker.scopeName}${marker.city ? ` · ${marker.city}` : ''}`,
      };
    })
    .filter((item) => !shouldFilterBySelectedRegion || item.regionId === selectedRegionId)
    .sort((left, right) => sortMarkersAsc(left.marker, right.marker));
}

export function getMapReplayStatusText(input: {
  total: number;
  activeItem?: MapReplayItem;
  currentIndex: number;
}) {
  const { total, activeItem, currentIndex } = input;

  if (total < 2) {
    return total === 0 ? '当前没有可回放的旅行记录' : '至少需要 2 条记录才能开始回放';
  }

  if (!activeItem) {
    return `${total} 条记录已准备好`;
  }

  return `${currentIndex + 1} / ${total} · ${activeItem.displayLabel} · ${activeItem.dateLabel}`;
}
