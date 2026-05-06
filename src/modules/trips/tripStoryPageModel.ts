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

export interface TripStoryPhotoSection {
  key: string;
  title: string;
  description: string;
  photos: TripDetailPhotoItemDto[];
}

export interface TripStoryRouteStop {
  key: string;
  date: string;
  label: string;
  companionName: string;
  companionColor: string;
}

export type TripStoryBadgeTone = 'route' | 'photo' | 'checklist' | 'guide' | 'metadata' | 'empty';

export interface TripStoryBadge {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: TripStoryBadgeTone;
}

export interface TripStoryRoutePosterStop {
  key: string;
  label: string;
  date: string;
  shortLabel: string;
  companionColor: string;
}

export interface TripStoryRoutePoster {
  title: string;
  subtitle: string;
  stops: TripStoryRoutePosterStop[];
  emptyText: string;
}

export type TripStoryShareCardVariant = 'square' | 'story';

export type TripStoryTemplate = 'magazine' | 'memoir' | 'postcard';

export interface TripStoryTemplatePalette {
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
}

export interface TripStoryShareCard {
  title: string;
  dateRange: string;
  coverImageUrl?: string;
  mainCopy: string;
  metrics: TripStoryHighlight[];
  palettes: Record<TripStoryTemplate, TripStoryTemplatePalette>;
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
  featuredPhotos: TripDetailPhotoItemDto[];
  photoSections: TripStoryPhotoSection[];
  lead: string;
  summaryText: string;
  smartNarrative: string;
  highlights: TripStoryHighlight[];
  timelineDays: TripStoryTimelineDay[];
  photoGroups: TripStoryPhotoGroup[];
  routeStops: TripStoryRouteStop[];
  badges: TripStoryBadge[];
  routePoster: TripStoryRoutePoster;
  shareCard: TripStoryShareCard;
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

export function buildTripStoryFeaturedPhotos(photos: TripDetailPhotoItemDto[], limit = 5) {
  const featured = photos.filter((photo) => photo.isFeatured);
  return (featured.length > 0 ? featured : photos).slice(0, limit);
}

export function buildTripStoryPhotoSections(photos: TripDetailPhotoItemDto[]): TripStoryPhotoSection[] {
  const featuredPhotos = buildTripStoryFeaturedPhotos(photos);
  const featuredIds = new Set(featuredPhotos.filter((photo) => photo.isFeatured).map((photo) => photo.imageId));
  const regularGroups = buildTripStoryPhotoGroups(
    featuredIds.size > 0 ? photos.filter((photo) => !featuredIds.has(photo.imageId)) : photos,
  );

  return [
    ...(featuredPhotos.length > 0
      ? [
          {
            key: 'featured',
            title: featuredPhotos.some((photo) => photo.isFeatured) ? '精选瞬间' : '照片开场',
            description: featuredPhotos.some((photo) => photo.isFeatured)
              ? '来自行程照片墙中手动标记的精选照片。'
              : '还没有手动精选照片，先用当前照片流生成故事开场。',
            photos: featuredPhotos,
          },
        ]
      : []),
    ...regularGroups.map((group) => ({
      key: group.date,
      title: group.date,
      description: '按旅行日期自动收拢的照片段落。',
      photos: group.photos,
    })),
  ];
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

function getShortRouteLabel(label: string) {
  const parts = label.split(' · ');
  return parts[parts.length - 1] || label;
}

function countMarkersWithMetadata(markers: TripDetailMarkerItemDto[]) {
  return markers.filter((marker) =>
    Boolean((marker.tags?.length ?? 0) > 0 || marker.mood || marker.weather || marker.transport || marker.budgetLevel),
  ).length;
}

export function buildTripStoryBadges(data: TripDetailResponseDto): TripStoryBadge[] {
  const checklistReview = buildTripStoryChecklistReview(data);
  const featuredCount = data.photos.filter((photo) => photo.isFeatured).length;
  const metadataCount = countMarkersWithMetadata(data.markers);
  const badges: TripStoryBadge[] = [];

  if (data.summary.markerCount === 0) {
    return [
      {
        id: 'waiting-for-records',
        label: '故事待启程',
        value: '0',
        description: '补充旅行记录后会自动生成路线、照片和回忆片段。',
        tone: 'empty',
      },
      {
        id: 'trip-dates-ready',
        label: '行程已创建',
        value: data.summary.travelDays > 0 ? `${data.summary.travelDays} 天` : '待记录',
        description: '故事页会先保留行程名称和日期，等待素材长出来。',
        tone: 'route',
      },
    ];
  }

  badges.push({
    id: 'route-span',
    label: data.summary.cityCount >= 2 ? '多城串联' : '单城深游',
    value: `${data.summary.cityCount}`,
    description:
      data.summary.cityCount >= 2
        ? `${data.summary.regionCount} 个地区连成这次路线。`
        : '路线更集中，适合沉淀一座城市的细节。',
    tone: 'route',
  });

  badges.push({
    id: 'photo-curation',
    label: featuredCount > 0 ? '精选照片' : '照片素材',
    value: featuredCount > 0 ? `${featuredCount}` : `${data.summary.photoCount}`,
    description:
      featuredCount > 0
        ? '已手动挑出故事优先展示的照片。'
        : data.summary.photoCount > 0
          ? '可继续在素材页标记精选照片。'
          : '补图后可生成更完整的视觉故事。',
    tone: 'photo',
  });

  badges.push({
    id: 'checklist-memory',
    label: checklistReview.total > 0 ? '清单完成' : '清单留白',
    value: checklistReview.total > 0 ? `${checklistReview.completionPercent}%` : '0',
    description:
      checklistReview.total > 0
        ? checklistReview.completionText
        : '行前清单会在故事末尾变成准备回顾。',
    tone: 'checklist',
  });

  badges.push({
    id: 'guide-context',
    label: data.summary.guideCount > 0 ? '攻略线索' : '自由探索',
    value: `${data.summary.guideCount}`,
    description:
      data.summary.guideCount > 0
        ? '关联攻略会作为这次出发的参考材料保留下来。'
        : '没有关联攻略，也可以保留纯记录型故事。',
    tone: 'guide',
  });

  badges.push({
    id: 'detail-density',
    label: metadataCount > 0 ? '细节标记' : '细节待补',
    value: `${metadataCount}`,
    description:
      metadataCount > 0
        ? '标签、天气、交通或预算已进入时间线叙事。'
        : '给记录补充标签和心情后，故事会更有层次。',
    tone: 'metadata',
  });

  if (data.summary.companionCount > 1) {
    badges.push({
      id: 'shared-memory',
      label: '共同回忆',
      value: `${data.summary.companionCount}`,
      description: `${data.companions.map((companion) => companion.name).join('、')} 一起出现在这次故事里。`,
      tone: 'metadata',
    });
  }

  return badges.slice(0, 6);
}

export function buildTripStoryRoutePoster(routeStops: TripStoryRouteStop[]): TripStoryRoutePoster {
  if (routeStops.length === 0) {
    return {
      title: '路线等待第一站',
      subtitle: '补充旅行记录后，会在这里生成静态路线回放海报。',
      stops: [],
      emptyText: '还没有可展示的路线停靠点。',
    };
  }

  const first = routeStops[0];
  const last = routeStops[routeStops.length - 1];
  const cityLine = routeStops.map((stop) => getShortRouteLabel(stop.label)).join(' / ');

  return {
    title: routeStops.length > 1 ? `${first.label} 到 ${last.label}` : `${first.label} 深游`,
    subtitle:
      routeStops.length > 1
        ? `${routeStops.length} 站路线回放 · ${cityLine}`
        : `${first.date} · ${first.companionName} 留下的单站记忆`,
    stops: routeStops.map((stop) => ({
      key: stop.key,
      label: stop.label,
      date: stop.date,
      shortLabel: getShortRouteLabel(stop.label),
      companionColor: stop.companionColor,
    })),
    emptyText: '',
  };
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

export function buildTripStoryShareCard(data: TripDetailResponseDto, coverImageUrl?: string): TripStoryShareCard {
  const highlights = buildTripStoryHighlights(data);
  return {
    title: data.trip.name,
    dateRange: formatDateRange(data.trip.startsAt, data.trip.endsAt),
    coverImageUrl,
    mainCopy: buildTripStorySmartNarrative(data),
    metrics: highlights.slice(0, 3),
    palettes: {
      magazine: {
        background: '#f8fafc',
        surface: '#ffffff',
        accent: '#2563eb',
        text: '#0f172a',
        muted: '#64748b',
      },
      memoir: {
        background: '#fff7ed',
        surface: '#fffaf3',
        accent: '#c2410c',
        text: '#2f241c',
        muted: '#7c5f48',
      },
      postcard: {
        background: '#ecfeff',
        surface: '#ffffff',
        accent: '#0f766e',
        text: '#12323a',
        muted: '#4b6670',
      },
    },
  };
}

export function buildTripStoryViewModel(data: TripDetailResponseDto): TripStoryViewModel {
  const featuredPhotos = buildTripStoryFeaturedPhotos(data.photos);
  const coverImageUrl = data.trip.coverImageUrl ?? featuredPhotos[0]?.imageUrl ?? data.photos[0]?.imageUrl;
  const routeStops = buildTripStoryRouteStops(data.markers);
  return {
    title: data.trip.name,
    dateRange: formatDateRange(data.trip.startsAt, data.trip.endsAt),
    coverImageUrl,
    featuredPhotos,
    photoSections: buildTripStoryPhotoSections(data.photos),
    lead: buildTripStoryLead(data),
    summaryText: buildTripStorySummaryText(data),
    smartNarrative: buildTripStorySmartNarrative(data),
    highlights: buildTripStoryHighlights(data),
    timelineDays: buildTripStoryTimelineDays(data.markers),
    photoGroups: buildTripStoryPhotoGroups(data.photos),
    routeStops,
    badges: buildTripStoryBadges(data),
    routePoster: buildTripStoryRoutePoster(routeStops),
    shareCard: buildTripStoryShareCard(data, coverImageUrl),
    guides: data.guides,
    checklistReview: buildTripStoryChecklistReview(data),
  };
}
