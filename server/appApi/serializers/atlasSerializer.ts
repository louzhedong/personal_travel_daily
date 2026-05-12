import type {
  AtlasCompareDto,
  AtlasExportModelDto,
  AtlasPlaceIndexDto,
  AtlasReplayItemDto,
  AtlasTimelineFiltersDto,
  AtlasTimelineResponseDto,
  AtlasTimelineSummaryDto,
  StatsTripFilterDto,
} from '../types.js';
import { countTravelDays, getYear, normalizeRegion, toDateOnlyString, type RawMarker } from '../services/stats/aggregator.js';
import type { AtlasTimelineQuery } from '../schemas/atlas.js';

function uniqueCount<T>(values: T[]) {
  return new Set(values).size;
}

export function serializeAtlasFilters(query: AtlasTimelineQuery): AtlasTimelineFiltersDto {
  return {
    year: query.year ?? 'all',
    month: query.month ?? 'all',
    scope: query.scope,
    companionId: query.companionId,
    tripId: query.tripId as StatsTripFilterDto | undefined,
    tag: query.tag,
    mood: query.mood,
    weather: query.weather,
    transport: query.transport,
    budgetLevel: query.budgetLevel,
  };
}

export function serializeAtlasSummary(markers: RawMarker[]): AtlasTimelineSummaryDto {
  const sorted = [...markers].sort((left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime());
  const regionKeys = markers.map((marker) => {
    const region = normalizeRegion(marker);
    return `${region.scope}:${region.scopeId}`;
  });
  return {
    markerCount: markers.length,
    travelDays: countTravelDays(markers),
    cityCount: uniqueCount(markers.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)),
    regionCount: uniqueCount(regionKeys),
    countryCount: uniqueCount(markers.filter((marker) => marker.scope === 'international').map((marker) => normalizeRegion(marker).scopeId)),
    photoCount: markers.reduce((sum, marker) => sum + marker.images.length, 0),
    companionCount: uniqueCount(markers.map((marker) => marker.companionId)),
    tripCount: uniqueCount(markers.flatMap((marker) => (marker.tripId ? [marker.tripId] : []))),
    firstVisitedAt: sorted[0] ? toDateOnlyString(sorted[0].visitedStartAt) : undefined,
    latestVisitedAt: sorted[sorted.length - 1] ? toDateOnlyString(sorted[sorted.length - 1].visitedStartAt) : undefined,
  };
}

export function buildAtlasExportModel(markers: RawMarker[], replay: AtlasReplayItemDto[]): AtlasExportModelDto {
  const years = Array.from(new Set(markers.map((marker) => getYear(marker.visitedStartAt)))).sort();
  const featuredPhoto = markers.flatMap((marker) => marker.images).find((image) => image.isFeatured) ?? markers.flatMap((marker) => marker.images)[0];
  const range = years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0] ?? '未开始';
  return {
    posterTitle: '旅行地图时间机器',
    posterSubtitle: `${range} · ${markers.length} 段旅行记录 · ${uniqueCount(markers.map((marker) => marker.city))} 座城市`,
    routeTitle: replay.length > 0 ? `${replay[0].title} → ${replay[replay.length - 1].title}` : '等待第一段旅行轨迹',
    indexTitle: `${uniqueCount(markers.map((marker) => marker.city))} 座城市索引`,
    featuredPhotoUrl: featuredPhoto?.imageUrl,
  };
}

export function serializeAtlasTimelineResponse(input: {
  query: AtlasTimelineQuery;
  availableYears: string[];
  companions: AtlasTimelineResponseDto['companions'];
  trips: AtlasTimelineResponseDto['trips'];
  markers: RawMarker[];
  replay: AtlasReplayItemDto[];
  placeIndex: AtlasPlaceIndexDto;
  compare: AtlasCompareDto;
  generatedAt: Date;
}): AtlasTimelineResponseDto {
  return {
    filters: serializeAtlasFilters(input.query),
    availableYears: input.availableYears,
    companions: input.companions,
    trips: input.trips,
    summary: serializeAtlasSummary(input.markers),
    replay: input.replay,
    placeIndex: input.placeIndex,
    compare: input.compare,
    exportModel: buildAtlasExportModel(input.markers, input.replay),
    generatedAt: input.generatedAt.toISOString(),
  };
}
