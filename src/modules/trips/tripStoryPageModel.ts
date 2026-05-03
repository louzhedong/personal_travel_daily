import type {
  TripChecklistGroup,
  TripChecklistStage,
} from '../../types';
import type {
  TripDetailGuideItemDto,
  TripDetailMarkerItemDto,
  TripDetailPhotoItemDto,
  TripDetailResponseDto,
} from '../../lib/api/types';
import { formatDateRange, formatVisitedRange } from '../../lib/date';
import {
  MARKER_BUDGET_LEVEL_LABELS,
  MARKER_MOOD_LABELS,
  MARKER_TAG_LABELS,
  MARKER_TRANSPORT_LABELS,
  MARKER_WEATHER_LABELS,
} from '../../lib/markerMetadata';

export interface TripStoryHighlight {
  label: string;
  value: string;
  description: string;
}

export interface TripStoryTimelineDay {
  date: string;
  title: string;
  markers: Array<
    TripDetailMarkerItemDto & {
      displayRange: string;
      metadataLabels: string[];
    }
  >;
}

export interface TripStoryPhotoGroup {
  date: string;
  photos: TripDetailPhotoItemDto[];
}

export interface TripStoryRouteStop {
  key: string;
  date: string;
  label: string;
  companionName: string;
  companionColor: string;
}

export interface TripStoryChecklistReview {
  total: number;
  doneCount: number;
  completionPercent: number;
  completionText: string;
  groups: Array<TripChecklistGroup & { readableStage: string }>;
}

export interface TripStoryViewModel {
  title: string;
  dateRange: string;
  coverImageUrl?: string;
  lead: string;
  summaryText: string;
  smartNarrative: string;
  highlights: TripStoryHighlight[];
  timelineDays: TripStoryTimelineDay[];
  photoGroups: TripStoryPhotoGroup[];
  routeStops: TripStoryRouteStop[];
  guides: TripDetailGuideItemDto[];
  checklistReview: TripStoryChecklistReview;
}

function compareDateText(left: string, right: string) {
  return left.localeCompare(right);
}

function sortMarkersByDate(markers: TripDetailMarkerItemDto[]) {
  return [...markers].sort((left, right) => {
    const dateCompare = compareDateText(left.visitedStartAt, right.visitedStartAt);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return `${left.scopeName}${left.city}`.localeCompare(`${right.scopeName}${right.city}`);
  });
}

function buildMarkerMetadataLabels(marker: TripDetailMarkerItemDto) {
  return [
    ...(marker.tags ?? []).map((tag) => MARKER_TAG_LABELS[tag]?.zh).filter(Boolean),
    marker.mood ? MARKER_MOOD_LABELS[marker.mood]?.zh : null,
    marker.weather ? MARKER_WEATHER_LABELS[marker.weather]?.zh : null,
    marker.transport ? MARKER_TRANSPORT_LABELS[marker.transport]?.zh : null,
    marker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[marker.budgetLevel]?.zh : null,
  ].filter((item): item is string => !!item);
}

export function buildTripStoryTimelineDays(markers: TripDetailMarkerItemDto[]): TripStoryTimelineDay[] {
  const groups = new Map<string, TripStoryTimelineDay['markers']>();

  sortMarkersByDate(markers).forEach((marker) => {
    const items = groups.get(marker.visitedStartAt) ?? [];
    items.push({
      ...marker,
      displayRange: formatVisitedRange(marker),
      metadataLabels: buildMarkerMetadataLabels(marker),
    });
    groups.set(marker.visitedStartAt, items);
  });

  return Array.from(groups.entries()).map(([date, items], index) => ({
    date,
    title: `第 ${index + 1} 段 · ${items.map((item) => item.city).join(' / ')}`,
    markers: items,
  }));
}

export function buildTripStoryPhotoGroups(photos: TripDetailPhotoItemDto[]): TripStoryPhotoGroup[] {
  const groups = new Map<string, TripDetailPhotoItemDto[]>();

  photos.forEach((photo) => {
    const items = groups.get(photo.visitedStartAt) ?? [];
    items.push(photo);
    groups.set(photo.visitedStartAt, items);
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => compareDateText(left, right))
    .map(([date, items]) => ({ date, photos: items }));
}

export function buildTripStoryRouteStops(markers: TripDetailMarkerItemDto[]): TripStoryRouteStop[] {
  const stops: TripStoryRouteStop[] = [];

  sortMarkersByDate(markers).forEach((marker) => {
    const label = `${marker.scopeName} · ${marker.city}`;
    const previous = stops[stops.length - 1];
    if (previous?.label === label) {
      return;
    }
    stops.push({
      key: marker.id,
      date: marker.visitedStartAt,
      label,
      companionName: marker.companionName,
      companionColor: marker.companionColor,
    });
  });

  return stops;
}

function readableChecklistStage(stage: TripChecklistStage) {
  switch (stage) {
    case 'pre_departure':
      return '出发前';
    case 'in_transit':
      return '旅途中';
    case 'done':
      return '已完成';
  }
}

export function buildTripStoryChecklistReview(data: TripDetailResponseDto): TripStoryChecklistReview {
  const { total, doneCount } = data.checklistSummary;
  const completionPercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return {
    total,
    doneCount,
    completionPercent,
    completionText:
      total > 0
        ? `${doneCount} / ${total} 项已完成，完成度 ${completionPercent}%`
        : '这次行程还没有沉淀行前清单。',
    groups: data.checklistGroups.map((group) => ({
      ...group,
      readableStage: readableChecklistStage(group.stage),
    })),
  };
}

export function buildTripStoryHighlights(data: TripDetailResponseDto): TripStoryHighlight[] {
  return [
    {
      label: '旅行天数',
      value: `${data.summary.travelDays}`,
      description: '按记录日期去重统计',
    },
    {
      label: '覆盖城市',
      value: `${data.summary.cityCount}`,
      description: `${data.summary.regionCount} 个地区串联成这次路线`,
    },
    {
      label: '同行旅伴',
      value: `${data.summary.companionCount}`,
      description: data.companions.map((companion) => companion.name).join(' / ') || '暂未记录旅伴',
    },
    {
      label: '照片素材',
      value: `${data.summary.photoCount}`,
      description: data.summary.photoCount > 0 ? '来自行程记录中的图片' : '这次还没有上传照片',
    },
    {
      label: '关联攻略',
      value: `${data.summary.guideCount}`,
      description: data.summary.guideCount > 0 ? '可回看当时参考的攻略' : '暂未关联攻略',
    },
    {
      label: '清单完成',
      value: `${buildTripStoryChecklistReview(data).completionPercent}%`,
      description: buildTripStoryChecklistReview(data).completionText,
    },
  ];
}

export function buildTripStoryLead(data: TripDetailResponseDto) {
  const firstMarker = sortMarkersByDate(data.markers)[0];
  if (data.trip.note.trim()) {
    return data.trip.note;
  }
  if (firstMarker) {
    return `从 ${firstMarker.scopeName} · ${firstMarker.city} 开始，把 ${data.summary.travelDays} 天的旅行重新翻成一页故事。`;
  }
  return '这次行程还没有旅行记录，故事页会在补充记录后自动丰满起来。';
}

export function buildTripStorySummaryText(data: TripDetailResponseDto) {
  const cityLabel = data.summary.cityCount > 0 ? `${data.summary.cityCount} 座城市` : '尚未记录城市';
  const companionLabel = data.companions.map((item) => item.name).join('、') || '独自出发';
  return `${formatDateRange(data.trip.startsAt, data.trip.endsAt)}，${companionLabel} 留下了 ${data.summary.markerCount} 条记录，串起 ${cityLabel}。`;
}

export function buildTripStorySmartNarrative(data: TripDetailResponseDto) {
  const sortedMarkers = sortMarkersByDate(data.markers);
  const firstMarker = sortedMarkers[0];
  const lastMarker = sortedMarkers[sortedMarkers.length - 1];
  const companionLabel = data.companions.map((item) => item.name).join('、') || '独自出发';
  const guideLabel = data.summary.guideCount > 0 ? `参考了 ${data.summary.guideCount} 篇攻略` : '没有额外攻略也照样出发';
  const photoLabel = data.summary.photoCount > 0 ? `留下 ${data.summary.photoCount} 张照片` : '照片还可以日后慢慢补上';

  if (!firstMarker) {
    return `${data.trip.name} 还在等待第一条旅行记录。等路线、照片和游记补齐后，这里会自动生成一段可导出的旅行序言。`;
  }

  const routeLabel =
    lastMarker && lastMarker.id !== firstMarker.id
      ? `从 ${firstMarker.scopeName} · ${firstMarker.city} 到 ${lastMarker.scopeName} · ${lastMarker.city}`
      : `在 ${firstMarker.scopeName} · ${firstMarker.city}`;

  return `${routeLabel}，${companionLabel} 用 ${data.summary.travelDays} 天走过 ${data.summary.cityCount} 座城市，${photoLabel}，也${guideLabel}。这页故事把记录、路线和准备清单收在一起，方便以后再翻回这次出发。`;
}

export function buildTripStoryViewModel(data: TripDetailResponseDto): TripStoryViewModel {
  return {
    title: data.trip.name,
    dateRange: formatDateRange(data.trip.startsAt, data.trip.endsAt),
    coverImageUrl: data.trip.coverImageUrl ?? data.photos[0]?.imageUrl,
    lead: buildTripStoryLead(data),
    summaryText: buildTripStorySummaryText(data),
    smartNarrative: buildTripStorySmartNarrative(data),
    highlights: buildTripStoryHighlights(data),
    timelineDays: buildTripStoryTimelineDays(data.markers),
    photoGroups: buildTripStoryPhotoGroups(data.photos),
    routeStops: buildTripStoryRouteStops(data.markers),
    guides: data.guides,
    checklistReview: buildTripStoryChecklistReview(data),
  };
}
